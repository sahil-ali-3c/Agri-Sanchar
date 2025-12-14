
'use server';

/**
 * Genkit flow for answering farmer questions related to farming practices,
 * crop management, and government schemes. It includes tools for fetching 
 * mandi prices and returning weather info. It can also analyze images.
 *
 * This file is written in TypeScript and expects the following packages to be
 * installed in your project: genkit (or your local ai wrapper), @genkit-ai/googleai,
 * and zod.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit'; // your ai wrapper (make sure this is exports a genkit instance)
import { PriceRecordSchema } from '@/ai/types';
import { getWeatherForecast } from './get-weather-forecast';


// ---------- Input / Output Schemas ----------
const AnswerFarmerQuestionInputSchema = z.object({
  question: z.string().describe('The question the farmer is asking.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo related to the question, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  city: z.string().optional().describe("The farmer's city, used to provide location-specific information like local market prices."),
  returnJson: z.boolean().optional().describe('Set to true to get a direct JSON output from tools if applicable.'),
  language: z.string().optional().describe("The user's preferred language setting (e.g., 'English', 'Hindi'). The AI should prioritize the language of the user's actual question over this setting."),
});
export type AnswerFarmerQuestionInput = z.infer<typeof AnswerFarmerQuestionInputSchema>;

const AnswerFarmerQuestionOutputSchema = z.object({
  answer: z.string().describe('The text answer to the farmer question.'),
  priceData: z.array(PriceRecordSchema).optional().describe('Structured JSON data for market prices if requested.'),
});
export type AnswerFarmerQuestionOutput = z.infer<typeof AnswerFarmerQuestionOutputSchema>;

// ---------- Tools ----------
const MandiPriceOutputSchema = z.object({
  records: z.array(PriceRecordSchema).optional(),
  error: z.string().optional(),
});

const getAiMandiPricesPrompt = ai.definePrompt({
    name: 'getAiMandiPricesPrompt',
    input: { schema: z.object({ city: z.string() }) },
    output: { schema: MandiPriceOutputSchema },
    prompt: `You are an expert agricultural market analyst. Provide a list of estimated current mandi (market) prices for 10 common agricultural commodities for the given city in India. The commodities should be relevant to the region.
The output must be in the requested JSON format. The 'modal_price' should be a number as a string.

City: {{{city}}}
Commodities examples: Wheat, Paddy, Cotton, Maize, Tomato, Potato, Onion, Soybean, Gram, Mustard.
`,
});


const getMandiPrices = ai.defineTool(
  {
    name: 'getMandiPrices',
    description: 'Provides a list of mandi (market) prices for various crops. Can be filtered by city.',
    inputSchema: z.object({ city: z.string().optional().describe("The city to find mandi prices for. If omitted, returns prices from across India.") }),
    outputSchema: MandiPriceOutputSchema,
  },
  async ({ city }) => {
    const apiKey = process.env.GOV_DATA_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return { error: 'API_KEY_MISSING' };
    }

    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=100`;

    if (city) {
      const encodedCity = encodeURIComponent(city);
      url += `&filters[market]=${encodedCity}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();

      if (!data.records || data.records.length === 0) {
        if (city) {
            console.log(`No data found for ${city} from data.gov.in, falling back to AI.`);
            const { output } = await getAiMandiPricesPrompt({ city });
            if (output?.records) {
                // Add the market key to each record for consistency
                const recordsWithMarket = output.records.map(rec => ({...rec, market: city}));
                return { records: recordsWithMarket };
            }
        }
        return { error: `NO_DATA_FOUND` };
      }

      const priceRecords = data.records.map((rec: any) => ({
        commodity: rec.commodity,
        modal_price: rec.modal_price,
        market: rec.market, // Include market name in the response
      }));

      return { records: priceRecords };

    } catch (error) {
        console.error('Error fetching mandi prices from data.gov.in, falling back to AI:', error);
        if (city) {
             const { output } = await getAiMandiPricesPrompt({ city });
             if (output?.records) {
                 const recordsWithMarket = output.records.map(rec => ({...rec, market: city}));
                 return { records: recordsWithMarket };
             }
        }
      return { error: `FETCH_FAILED` };
    }
  }
);

const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Provides the 7-day weather forecast for a given city.',
    inputSchema: z.object({ city: z.string().describe('The city for which to get the weather forecast.') }),
    outputSchema: z.string(),
  },
  async ({ city }) => {
    try {
      const forecast = await getWeatherForecast({ city });
      if (forecast.error) {
        return forecast.error;
      }
      
      // Format the structured data into a readable string for the chatbot.
      let weatherString = `Here is the 7-day forecast for ${city}:\n`;
      forecast.weekly?.forEach(day => {
        weatherString += `- ${day.day}: ${day.temp}, ${day.condition}\n`;
      });
      return weatherString;

    } catch (error) {
      console.error("Error getting weather for chatbot:", error);
      return `Sorry, I was unable to fetch the weather forecast for ${city} at this time.`;
    }
  }
);

// ---------- Prompt / Flow ----------
const answerFarmerQuestionPrompt = ai.definePrompt({
  name: 'answerFarmerQuestionPrompt',
  input: { schema: AnswerFarmerQuestionInputSchema.extend({ currentDate: z.string() }) },
  tools: [getMandiPrices, getWeather],
  prompt: `You are Agri-Sanchar, a friendly and expert AI assistant for farmers, with a conversational style like a knowledgeable friend. Your goal is to provide comprehensive, well-structured, and natural-sounding answers to farmers' questions.
Use relevant emojis (like 🌱, 💧, 🌾, ✅) to make your answers more engaging, but do not overdo it.

**CRITICAL INSTRUCTION**: You MUST detect the language of the user's question ("{{{question}}}") and provide your entire response in that same language.
- If the user asks in **Hindi**, reply entirely in **Devanagari script**.
- If the user asks in **English**, reply entirely in **English**.
- The user's profile language is set to '{{language}}', but you must **always prioritize the language of the question itself**.

**FORMATTING INSTRUCTIONS FOR SPEECH**:
- Your entire response will be read aloud by a text-to-speech engine.
- Do NOT use any special characters for formatting like asterisks (*), hashtags (#), or numbered lists (1., 2.).
- Write in simple, clear sentences and paragraphs.
- Use headings, but make them natural parts of the sentence, for example: "Regarding your question about wheat..."
- When giving steps, describe them in plain sentences, such as: "First, you should observe the leaves. Next, you can apply the recommended action."

When you use the 'getMandiPrices' tool, you receive JSON data. Format this data into a human-readable list within your response. For example: "Here are the prices for [City]: The price for Wheat is [Price] per quintal." Do not output raw JSON unless the user has explicitly requested JSON output. If the data includes the market, include that in the table.

If asked for the current date, day, or time, use this: {{{currentDate}}}.

{{#if photoDataUri}}
A photo has been provided. You MUST analyze this photo in the context of the user's question. If the user is asking to identify a problem (like a disease or pest), perform a step-by-step diagnosis.

First, describe what you see in the image (crop type, symptoms).
Second, provide the most likely diagnosis.
Third, give clear, actionable steps as a recommendation.
Fourth, give advice on how to prevent this issue in the future.

If the question is not about a problem, use the image as context to answer the question. Here is the photo: {{media url=photoDataUri}}
{{/if}}

You have access to the following information (RAG). Use it to answer common questions about government schemes and crop information. Do not mention that you have this information unless asked.

<RAG_KNOWLEDGE>
  <GOVERNMENT_SCHEMES>
    - PM-KISAN: A central sector scheme with 100% funding from the Government of India. It provides an income support of \u20B96,000 per year in three equal installments to all land-holding farmer families. The fund is directly transferred to the bank accounts of the beneficiaries.
    - Pradhan Mantri Fasal Bima Yojana (PMFBY): A crop insurance scheme to provide insurance coverage and financial support to farmers in the event of failure of any of the notified crops as a result of natural calamities, pests, and diseases.
    - Kisan Credit Card (KCC): A scheme that provides farmers with timely access to credit for their agricultural needs. It covers expenses for cultivation, post-harvest activities, and consumption requirements of farmer households.
    - Eligibility: All landholding farmer families, who have cultivable landholding in their names.
  </GOVERNMENT_SCHEMES>

  <CROP_INFORMATION>
    - General Knowledge: India is the world's largest producer of milk, pulses, and jute, and ranks as the second-largest producer of rice, wheat, sugarcane, groundnut, vegetables, fruit, and cotton.
    - Wheat (Gehu):
      - Sowing Time: Rabi Season (October to December).
      - Water Requirement: Requires about 4-6 irrigations depending on soil type and weather. Critical stages for irrigation are Crown Root Initiation (CRI) and flowering.
      - Common Diseases: Rust (Yellow, Brown, Black), Powdery Mildew, Loose Smut.
      - Major Producing States: Uttar Pradesh, Punjab, Haryana, Madhya Pradesh, Rajasthan.
    - Rice (Dhaan):
      - Sowing Time: Kharif Season (June to July). Nursery is planted first.
      - Water Requirement: High. Requires a flooded field for a significant part of its growth.
      - Common Diseases: Blast, Bacterial Blight, Sheath Blight.
      - Major Producing States: West Bengal, Uttar Pradesh, Punjab, Tamil Nadu, Andhra Pradesh.
    - Maize (Makka):
      - Sowing Time: Kharif Season (June to July).
      - Water Requirement: Moderate. Requires about 4-5 irrigations. Sensitive to waterlogging.
      - Common Diseases: Turcicum Leaf Blight, Maydis Leaf Blight, and Stalk Rot.
      - Major Producing States: Karnataka, Madhya Pradesh, Maharashtra, Rajasthan, Uttar Pradesh.
    - Cotton (Kapas):
      - Sowing Time: Kharif Season (April to June).
      - Water Requirement: Requires about 6-7 irrigations. Sensitive to both drought and excessive water.
      - Common Pests: Bollworm, Aphids, Whitefly.
      - Major Producing States: Gujarat, Maharashtra, Telangana, Andhra Pradesh, Rajasthan.
  </CROP_INFORMATION>

  <ORGANIC_FARMING>
    - Principles: A system of farming that avoids the use of synthetic fertilizers, pesticides, and genetically modified organisms (GMOs). It focuses on soil health, biodiversity, and ecological balance.
    - Certification: In India, organic farming is certified under the National Programme for Organic Production (NPOP).
    - Organic Fertilizers:
      - Compost: Decomposed organic matter. Improves soil structure and nutrient content.
      - Farmyard Manure (FYM): Decomposed mixture of dung and urine with litter.
      - Vermicompost: Compost made by earthworms. Rich in nutrients.
      - Jeevamrut: A fermented microbial culture made from cow dung, cow urine, jaggery, gram flour, and water. It enhances soil microbial activity.
    - Organic Pest Control:
      - Neem Oil: A natural pesticide and fungicide. Effective against many pests.
      - Crop Rotation: Changing the type of crops grown in the same area in sequenced seasons to disrupt pest and disease cycles.
      - Intercropping: Growing two or more crops in proximity to promote interaction that benefits one or both.
      - Beneficial Insects: Introducing or encouraging natural predators like ladybugs (for aphids) and Trichogramma wasps.
      - Pheromone Traps: Used to monitor and trap specific insect pests.
  </ORGANIC_FARMING>
  
  <PEST_MANAGEMENT>
    <INSECT_INFESTATION>
        - Definition: The presence of a large number of insects causing damage to crops.
        - Common Types: Sucking pests (aphids, whiteflies, jassids), chewing pests (bollworms, stem borers).
        - Symptoms: Yellowing leaves, holes in leaves or fruits, wilting, sticky "honeydew" substance.
        - Management: Use of insecticides (chemical or organic), pheromone traps, encouraging natural predators.
    </INSECT_INFESTATION>
    <FUNGAL_DISEASE>
        - Definition: Diseases caused by pathogenic fungi that infect plants.
        - Common Types: Rusts, smuts, mildews, blights, wilts.
        - Symptoms: Spots on leaves (yellow, brown, black), powdery growth, wilting, root rot.
        - Management: Use of fungicides (contact or systemic), crop rotation, proper irrigation to avoid waterlogging.
    </FUNGAL_DISEASE>
    <BACTERIAL_DISEASE>
        - Definition: Diseases caused by bacteria. They often enter plants through wounds or natural openings.
        - Common Types: Bacterial blight, bacterial leaf spot, citrus canker.
        - Symptoms: Water-soaked spots on leaves that turn dark, wilting, oozing from plant parts.
        - Management: Use of bactericides (often copper-based), using disease-free seeds, improving air circulation.
    </BACTERIAL_DISEASE>
    <VIRAL_DISEASE>
        - Definition: Diseases caused by viruses, often transmitted by insects (vectors) like aphids and whiteflies.
        - Common Types: Mosaic viruses (e.g., Yellow Vein Mosaic), leaf curl viruses.
        - Symptoms: Mottled or mosaic patterns on leaves, yellowing, stunted growth, distorted plant parts.
        - Management: No cure for viral diseases. Management focuses on controlling the insect vectors, removing and destroying infected plants, and using virus-resistant varieties.
    </VIRAL_DISEASE>
    <INTEGRATED_PEST_MANAGEMENT_IPM>
        - Definition: A holistic, ecosystem-based strategy that focuses on long-term prevention of pests through a combination of techniques such as biological control, habitat manipulation, modification of cultural practices, and use of resistant varieties.
        - Principles: Monitoring pests, using chemical pesticides only when necessary, and choosing the least toxic options.
    </INTEGRATED_PEST_MANAGEMENT_IPM>
    <PESTICIDE_RESISTANCE>
        - Definition: The decreased susceptibility of a pest population to a pesticide that was previously effective.
        - Cause: Repeated use of the same type of pesticide over time, which selects for resistant individuals in the pest population.
        - Management: Rotating pesticides with different modes of action, using IPM practices, and avoiding overuse of any single chemical.
    </PESTICIDE_RESISTANCE>
  </PEST_MANAGEMENT>
  
  <CROP_MANAGEMENT>
    <CROP_ROTATION>
        - Definition: The practice of growing a series of different types of crops in the same area across a sequence of growing seasons.
        - Benefits: Improves soil health and fertility, reduces soil erosion, helps control pests and weeds, and increases crop yield.
        - Example: Planting a legume crop like gram or lentil after a cereal crop like rice or wheat helps to replenish soil nitrogen. A common rotation in North India is Rice-Wheat.
    </CROP_ROTATION>
    <SOWING_METHODS>
        - Broadcasting: Scattering seeds by hand over the field. It's a quick but inefficient method, leading to uneven plant density.
        - Drilling/Line Sowing: Sowing seeds in rows at a uniform depth using a seed drill. It ensures better germination and makes intercultural operations like weeding easier.
        - Transplanting: Raising seedlings in a nursery and then planting them in the main field. Common for crops like rice and many vegetables. It allows for better initial care and selection of healthy seedlings.
    SOWING_METHODS>
    <GERMINATION>
        - Definition: The process by which a seed develops into a seedling.
        - Requirements: Requires adequate moisture (water), temperature (warmth), and oxygen.
        - Seed Viability: The ability of a seed to germinate. It's important to use seeds with high germination rates.
    </GERMINATION>
    <GROWTH_STAGES>
        - Seedling Stage: The initial stage after germination, where the young plant establishes its roots and first leaves.
        - Vegetative Stage: The period of rapid growth where the plant develops its leaves, stems, and roots. The plant accumulates energy for the reproductive phase.
        - Reproductive Stage (Flowering/Fruiting): The stage where the plant produces flowers, fruits, and seeds. This stage is critical for yield. Nutrient and water requirements are often highest during this phase.
        - Maturity Stage: The final stage where the crop ripens and is ready for harvest.
    </GROWTH_STAGES>
    <WEED_CONTROL>
        - Definition: The process of limiting weed infestation so that crops can be grown profitably.
        - Manual Weeding: Removing weeds by hand or using hand tools like a khurpi. It is labor-intensive but effective for small areas.
        - Mechanical Weeding: Using animal-drawn or tractor-drawn implements (like cultivators or hoes) to remove weeds between crop rows.
        - Chemical Weeding (Herbicides): Using chemicals to kill weeds. Herbicides can be pre-emergent (applied before weeds appear) or post-emergent (applied after weeds appear). It is crucial to use the correct herbicide for the crop and weed type to avoid crop damage.
    </WEED_CONTROL>
  </CROP_MANAGEMENT>

  <IRRIGATION_WATER_MANAGEMENT>
      <DRIP_IRRIGATION>
        - Definition: A type of micro-irrigation system that saves water and nutrients by allowing water to drip slowly to the roots of plants, either from above the soil surface or buried below the surface.
        - Advantages: High water efficiency (up to 95%), reduces weed growth, allows for fertigation (applying fertilizers with water).
        - Suitable for: Row crops (vegetables, cotton), orchards, vineyards, and greenhouse cultivation.
      </DRIP_IRRIGATION>
      <SPRINKLER_IRRIGATION>
        - Definition: A method of applying irrigation water which is similar to natural rainfall. Water is distributed through a system of pipes by pumping and sprayed into the air.
        - Advantages: Suitable for sandy soils where water percolates quickly, can cover large and uneven areas, helps in cooling the micro-climate during high temperatures.
        - Disadvantages: Can be affected by high winds, leading to uneven distribution. Higher evaporative losses compared to drip irrigation.
      </SPRINKLER_IRRIGATION>
      <WATER_HARVESTING>
        - Definition: The collection and storage of rainwater and runoff for reuse on-site, rather than allowing it to run off and be lost.
        - Methods: Farm ponds (Talab), check dams (Bandhara), rooftop rainwater harvesting into tanks, percolation tanks to recharge groundwater.
        - Importance: Recharges groundwater levels, provides a crucial source of supplemental irrigation during dry spells, and reduces soil erosion.
      </WATER_HARVESTING>
      <CANAL_IRRIGATION>
        - Definition: A system where water is diverted from rivers or reservoirs into a network of canals (main canals, branch canals, distributaries) to irrigate fields. It's a major source of irrigation in states like Punjab, Haryana, and Uttar Pradesh.
        - Challenges: Water availability depends on the government's release schedule ('Warabandi' system), potential for waterlogging and soil salinity if drainage is poor, and tail-end farmers often receive less water.
      </CANAL_IRRIGATION>
      <GROUNDWATER_IRRIGATION>
          - Definition: Extracting water from underground aquifers using tube wells or borewells. It is a critical source of irrigation in India.
          - Importance: Provides a reliable and on-demand water supply, giving farmers control over irrigation timing.
          - Challenges: Over-extraction is leading to a rapid decline in groundwater levels in many parts of the country, increased electricity costs for pumping, and risk of water contamination (e.g., with arsenic, fluoride).
      </GROUNDWATER_IRRIGATION>
      <WATER_CONSERVATION>
          - Definition: The practice of using water efficiently to reduce unnecessary water usage.
          - Techniques:
            - Mulching: Covering the soil surface with organic (straw, husk) or plastic mulch to reduce evaporation.
            - Laser Land Leveling: Creating a perfectly flat field to ensure uniform water distribution and reduce water loss.
            - Zero Tillage: Planting crops directly into the residue of the previous crop without tilling the soil, which helps retain soil moisture.
            - Choosing water-efficient crops (e.g., millets, pulses) in water-scarce areas.
      </WATER_CONSERVATION>
  </IRRIGATION_WATER_MANAGEMENT>

  <SOIL_MANAGEMENT>
    <SOIL_TESTING>
        - Definition: A scientific analysis of a soil sample to determine its nutrient content, composition, and other characteristics like pH level.
        - Importance: Helps farmers understand the fertility of their soil, avoid over/under-use of fertilizers, and improve crop yield. It is a key part of cost-effective and environmentally friendly farming.
        - How to: Samples should be collected from multiple spots in a field to create a representative composite sample.
    </SOIL_TESTING>
    <SOIL_HEALTH_CARD>
        - Definition: A government scheme in India that provides farmers with a report on the nutrient status of their soil along with recommendations on the appropriate dosage of nutrients to improve soil health and fertility.
        - Content: The card displays the soil's status for 12 parameters: N, P, K (macronutrients); S (secondary-nutrient); Zn, Fe, Cu, Mn, Bo (micronutrients); and pH, EC, OC (physical parameters).
    </SOIL_HEALTH_CARD>
    <SOIL_FERTILITY>
        - Definition: The ability of the soil to sustain agricultural plant growth, i.e., to provide plant habitat and result in sustained and consistent yields of high quality.
        - NPK (Nitrogen, Phosphorus, Potassium): The three primary macronutrients essential for plant growth. Nitrogen is for leaf growth, Phosphorus for root, flower, and fruit development, and Potassium for overall plant health and disease resistance.
        - Micronutrients: Nutrients required in smaller quantities but are still essential for plant growth, such as Zinc (Zn), Iron (Fe), Boron (B), and Manganese (Mn). Deficiencies can cause poor growth.
    </SOIL_FERTILITY>
    <PH_LEVEL>
        - Definition: A measure of how acidic or alkaline the soil is. A pH of 7 is neutral. Below 7 is acidic, and above 7 is alkaline.
        - Importance: Soil pH affects nutrient availability. Most crops prefer a pH range of 6.0 to 7.5.
        - Management: Lime can be added to acidic soils to raise pH. Gypsum or organic matter can be used on alkaline soils to lower pH.
    </PH_LEVEL>
    <SOIL_MOISTURE>
        - Definition: The water held in the spaces between soil particles.
        - Importance: Essential for nutrient transport and photosynthesis. Proper soil moisture is critical for seed germination and plant growth.
        - Conservation: Techniques like mulching, cover cropping, and adding organic matter can help retain soil moisture.
    </SOIL_MOISTURE>
    <SOIL_EROSION>
        - Definition: The displacement of the upper layer of soil, a form of soil degradation. It is caused by agents such as water, wind, and tillage.
        - Prevention: Contour farming, terracing, building check dams, and planting cover crops can help prevent soil erosion.
    </SOIL_EROSION>
    <LAND_PREPARATION>
        - Definition: The process of preparing the land for sowing seeds or planting seedlings.
        - Steps: Includes ploughing (tilling) to loosen the soil, levelling to ensure uniform water distribution, and manuring to improve fertility.
        - Tillage: Can be conventional (deep ploughing) or conservation (minimum/zero tillage) which helps in conserving soil and water.
    </LAND_PREPARATION>
  </SOIL_MANAGEMENT>

  <WEATHER_CLIMATE_DATA>
    - General Knowledge: Access to real-time and historical weather data from APIs like OpenWeatherMap and agroclimatic data from NASA POWER.
    - Key Metrics: Temperature, rainfall, humidity, wind speed.
  </WEATH_CLIMATE_DATA>

  <PEST_DISEASE_DATA>
    - General Knowledge: Access to image datasets of infected crops from sources like PlantVillage and PlantDoc.
    - Content: Pest identification guides and treatment information.
  </PEST_DISEASE_DATA>

  <MARKET_PRICE_DATA>
    - General Knowledge: Daily mandi prices from Agmarknet (Govt. of India) and global agricultural statistics from FAOSTAT.
    - Content: Commodity demand and supply trends.
  </MARKET_PRICE_DATA>
  
  <REMOTE_SENSING_DATA>
      - General Knowledge: Access to satellite imagery from Sentinel Hub (free) and USGS Earth Explorer (Landsat data).
      - Applications: Crop health monitoring (NDVI, EVI), and drought/flood mapping.
  </REMOTE_SENSING_DATA>

  <AGRI_ECONOMICS>
    <MSP>
      - Definition: The Minimum Support Price (MSP) is a form of market intervention by the Government of India to insure agricultural producers against any sharp fall in farm prices.
      - Announcement: MSP is announced by the Government of India at the beginning of the sowing season for certain crops on the basis of the recommendations of the Commission for Agricultural Costs and Prices (CACP).
      - Objective: It is to protect the farmers from distress sales and to procure food grains for public distribution. If the market price for the commodity falls below the announced minimum price, government agencies purchase the entire quantity offered by the farmers at the announced minimum price.
    </MSP>
    <AGRI_MARKET>
      - e-NAM: The Electronic National Agriculture Market (e-NAM) is a pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.
      - APMC: Agricultural Produce Market Committees (APMCs) are marketing boards established by state governments in India to ensure farmers are not exploited by large retailers. They ensure that farm-to-retail price spread does not operate at the cost of farmers.
    </AGRI_MARKET>
    <SUPPLY_CHAIN>
      - Definition: The sequence of processes involved in the production and distribution of a commodity. In agriculture, it involves farmers, processors, distributors, retailers, and consumers.
      - Challenges: Lack of storage, inefficient transportation, involvement of multiple middlemen, and information asymmetry.
      - Improvement: Technology like blockchain is being explored for better traceability and efficiency.
    </SUPPLY_CHAIN>
    <AGRI_TRADING>
      - Futures Contracts: A futures contract is a legal agreement to buy or sell a particular commodity at a predetermined price at a specified time in the future. It is used for hedging against price risk.
      - Commodity Exchanges: In India, exchanges like the National Commodity and Derivatives Exchange (NCDEX) and Multi Commodity Exchange (MCX) facilitate trading in agricultural commodity futures.
    </AGRI_TRADING>
    <COLD_STORAGE>
      - Importance: Crucial for perishable commodities like fruits, vegetables, and flowers to reduce post-harvest losses and extend market availability.
      - Government Schemes: The government provides subsidies and support for the establishment of cold storage facilities through schemes like the Mission for Integrated Development of Horticulture (MIDH).
    </COLD_STORAGE>
    <EXPORT_CROPS>
      - Major Exports: India is a major exporter of rice (especially Basmati), spices, cotton, marine products, and buffalo meat.
      - APEDA: The Agricultural and Processed Food Products Export Development Authority (APEDA) is the apex body that promotes the export of agricultural and processed food products from India.
    </EXPORT_CROPS>
    <DEMAND_FORECASTING>
      - Definition: The process of predicting the future demand for a product. In agriculture, it helps in planning production and managing inventory.
      - Factors: Based on historical sales data, weather forecasts, market trends, and consumer behavior.
      - Importance: Helps in preventing price volatility and ensures food security.
    </DEMAND_FORECASTING>
  </AGRI_ECONOMICS>
</RAG_KNOWLEDGE>

The farmer has asked the following question:
"{{{question}}}"

{{#if city}}
The farmer is from '{{city}}'. If the question is about market prices, crop rates, or selling produce, use the 'getMandiPrices' tool with the farmer's city to provide local market information. If the question is about weather, use the 'getWeather' tool.
{{else}}
If the question is about market prices, crop rates, or selling produce, use the 'getMandiPrices' tool to provide market information. You can ask for a city if more specific information is needed.
{{/if}}

If the question is about government schemes or general crop information, use your RAG_KNOWLEDGE first before searching online or using other tools.
  `,
});

export async function answerFarmerQuestion(input: AnswerFarmerQuestionInput): Promise<AnswerFarmerQuestionOutput> {
  return answerFarmerQuestionFlow(input);
}

const answerFarmerQuestionFlow = ai.defineFlow(
  {
    name: 'answerFarmerQuestionFlow',
    inputSchema: AnswerFarmerQuestionInputSchema,
    outputSchema: AnswerFarmerQuestionOutputSchema,
  },
  async (input) => {
    try {
        // If the request is for JSON price data, call the tool directly and return.
        if (input.returnJson) {
            const priceData = await getMandiPrices({ city: input.city });
            if (priceData.error) {
                return { answer: priceData.error };
            }
            return { answer: '', priceData: priceData.records };
        }

        const currentDate = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        });
        
        const requestData = {
            ...input,
            currentDate,
        };

        const llmResponse = await answerFarmerQuestionPrompt(requestData);
        const answer = llmResponse.text;

        if (answer) {
            return { answer: answer };
        }

        return { answer: "Sorry, I couldn't generate an answer right now. Please try again or provide more details." };

    } catch (err) {
        console.error("Error in answerFarmerQuestionFlow:", err);
        return { answer: "Sorry, I couldn't generate an answer right now. The AI service may be temporarily down. Please try again later." };
    }
  }
);
