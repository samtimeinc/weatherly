import { use } from "react";
import { useState } from "react";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getWeather() {
    if (!city) return;

    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/weather?city=${city}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request Failed");
      }

      setWeather(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Weatherly</h1>
      <input
        type="text"
        placeholder="Enter city (ex: London)"
        value={city}
        onChange={(event) => setCity(event.target.value)}
      />

      <button onClick={getWeather} style={{ marginLeft: 8 }}>
        Get Weather
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {weather && (
        <div style={{ marginTop: 20 }}>
          <h2>
            {weather.location.name}, {weather.location.country}
          </h2>

          <p>
            {weather.current.temp} Celcius - {weather.current.description}
          </p>

          <p>Feels Like: {weather.current.feels_like} Celcius</p>

          <p>Humidity: {weather.current.humidity}%</p>

          <p>Wind Speed: {weather.current.windSpeed}m/s</p>

          <h3>5-Day Forecast</h3>

          <ul>
            {weather.forecast.map((day) => (
              <li key={day.date}>
                {day.date}: {day.tempMin} / {day.tempMax} - {day.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
