import React, { useState } from "react";
import './App.css';

export default function Search({ setWeather }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    setLoading(true);

    const apiKey = "210517571e504e718c894116241908"; // Your API key
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${search}&aqi=yes`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setWeather(data); // Update App component's state
      } else {
        alert("City not found. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Search-Container">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Enter city name"
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}





