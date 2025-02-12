const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());

// API Key and Base URL
const apiKey = "eps_rxv5dl4LN7jOltdWSAtoenWSLUmlhnEVjE3NQnsCoGREYukZ";
const baseUrl = "https://rag.epsilla.com";

// Endpoint to handle the query
app.post("/search", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    try {
        const createSearchUrl = `${baseUrl}/search/7b6bcce0-88dc-47f1-8ed6-34066bfad8fa-347576414/99d36e08-aaa4-4a50-862e-35889f7d3db1/create`;
        const createResponse = await axios.post(createSearchUrl, { question: query }, {
            headers: {
                "X-API-Key": apiKey,
                "Content-Type": "application/json",
            },
        });

        const searchId = createResponse.data.result.searchId;
        const streamUrl = `${baseUrl}/search/stream/7b6bcce0-88dc-47f1-8ed6-34066bfad8fa-347576414/99d36e08-aaa4-4a50-862e-35889f7d3db1/${searchId}`;
        let answer = null;

        while (true) {
            const streamResponse = await axios.get(streamUrl, {
                headers: {
                    "X-API-Key": apiKey,
                },
            });

            const result = streamResponse.data;
            if (result.result.completed) {
                answer = result.result.content.Answer;
                break;
            }

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        }

        res.json({ answer });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Failed to fetch the answer" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
