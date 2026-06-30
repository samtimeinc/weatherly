import http from "http";
import axios from "axios";
import dotenv from "dotenv";
import url from "url";
import { promiseHooks } from "v8";
import { send } from "process";
import { error } from "console";

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const PORT = 3000;

const BASE_URL = "https://api.openweathermap.org/data/2.5";

function sendJSON(response, status, data) {
    response.writeHead(status, {
        "Content-Type" : "application/json",
        "Access-Control-Allow-Origin" : "*",
        "Access-Control-Allow-Methods" : "GET, OPTIONS",
        "Access-Control-Allow-Headers" : "Content-Type",
    });

    response.end(JSON.stringify(data));
}

function buildDailyForecast(list) {
    const byDate = {};

    list.forEach((entry) => {
        const date = entry.dt_txt.split(" ") [0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(entry);
    });

    return Object.keys(byDate).slice(0, 5).map((date) => {
        const items = byDate[date];
        const mid = items[Math.floor(items.length / 2)];
        return {
            date,
            tempMin: Math.min(...items.map((i) => i.main.temp)),
            tempMax: Math.max(...items.map((i) => i.main.temp)),
            description: mid.weather[0].description,
            icon: mid.weather[0].icon,
        };
    });
}

function buildWeatherResponse(current, forecast) {
    return {
        location: {
            name: current.name,
            country: current.sys.country,
        },
        current: {
            temp: current.main.temp,
            feels_like: current.main.feels_like,
            description: current.weather[0].description,
            icon: current.weather[0].icon,
            humidity: current.main.humidity,
            windSpeed: current.wind.speed,
        },
        forecast: buildDailyForecast(forecast.list),
    };
}

const server = http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
        response.writeHead(204, {
        "Access-Control-Allow-Origin" : "*",
        "Access-Control-Allow-Methods" : "GET, OPTIONS",
        "Access-Control-Allow-Headers" : "Content-Type",
        });
        return response.end();
    }

    const parsed = url.parse(request.url, true);
    const path =  parsed.pathname;
    const query = parsed.query;

    if (path === "/api/weather") {
        const city = query.city;
        const units = query.units || "metric";

        if (!city) {
            return sendJSON(response, 400, { error: "City is required" });
        }

        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                axios.get(
                    `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${units}`
                ),
                axios.get(
                    `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=${units}`
                ),
            ]);

            const data = buildWeatherResponse(currentResponse.data, forecastResponse.data);
            return sendJSON(response, 200, data);
        } catch (error) {
            console.error("Weather city error: ", error.response?.data);
            return sendJSON(response, 500, { error: "Weather lookup by city failed" });
        }
    }

    if (path === "/api/weather/coords") {
        const { lat, lon, units = "metric"} = query;

        if (!lat || !lon) {
            return sendJSON(response, 400, { error: "Latitude and longitude required"});
        }

        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                axios.get(
                    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`
                ),
                axios.get(
                    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`
                ),
            ]);

            const data = buildWeatherResponse(currentResponse.data, forecastResponse.data);
            return sendJSON(response, 200, data);
        } catch (error) {
            console.error("Weather coordinates error: ", error.response?.data);
            return sendJSON(response, 500, { error: "Weather lookup by coordinates failed" });
        }
    }

    sendJSON(response, 404, { error: "Not found"});
});

server.listen(PORT, () => {
    console.log(`Weather server running at http://localhost:${PORT}`);
})