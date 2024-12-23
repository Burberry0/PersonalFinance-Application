import React from "react";
import { useState } from "react";
import Search from "../Search";
import Table from "../Table";
import '/Users/brandonkohler/react-ec/app/src/Navbar/Navbar.css';

export default function Home() {
    const [weather, setWeather] = useState(null);
    
    return(
        <div className="container">
            <div className="Home">
                <div className='Header'>
                    <h1>Weather</h1>
                    <p>This is the weather for {weather ? weather.location.name : "a location"} </p>
                </div>
      
                <div className='Search'>
                    <Search setWeather={setWeather} />
                </div>

                <div className='Table'>
                    {weather && <Table weather={weather} />}
                </div>

            </div>
        </div>
    );
}

