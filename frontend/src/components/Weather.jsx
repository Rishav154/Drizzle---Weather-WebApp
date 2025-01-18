import { useState, useEffect } from "react";
import axios from "axios";
import clear_day from "../assets/clear_day.png";
import clear_night from "../assets/clear_night.png";
import cloudy_day from "../assets/cloudy_day.png";
import cloudy_night from "../assets/cloudy_night.png";
import thunderstorm from "../assets/thunderstorm.png";
import rainy from "../assets/rainy.png";
import fog from "../assets/fog.png";

import wind from "../assets/wind.png";
import pressure from "../assets/pressure.png";
import feels_like from "../assets/feels_like.png";
import humidity from "../assets/humidity.png";
import max_min from "../assets/max-min.png";

function Weather() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [cityInput, setCityInput] = useState("");

    // Default location (New York)
    const defaultLocation = {
        latitude: 40.7128,
        longitude: -74.0060
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported");
            handleLocationError();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Got position:", position.coords);
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                handleLocationError();
            }
        );
    }, []);

    const handleLocationError = () => {
        alert("To get accurate weather for your location, please:\n1. Allow location access in your browser\n2. Disable VPN if you're using one\n3. Try refreshing the page");
        setLocation(defaultLocation);
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDate(new Date());
        }, 5000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (location) {
            fetchWeatherData();
        }
    }, [location]);

    const fetchWeatherData = async () => {
        try {
            const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
            // Fetch current weather
            const weatherResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                    params: {
                        lat: location.latitude,
                        lon: location.longitude,
                        appid: API_KEY,
                        units: 'metric'
                    }
                }
            );

            const forecastResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast`,
                {
                    params: {
                        lat: location.latitude,
                        lon: location.longitude,
                        appid: API_KEY,
                        units: 'metric'
                    }
                }
            );

            setWeatherData(weatherResponse.data);
            setForecastData(forecastResponse.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch weather data');
        } finally {
            setLoading(false);
        }
    };

    const searchByCity = async () => {
        if (!cityInput.trim()) return;

        try {
            setLoading(true);
            const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
            const weatherResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                    params: {
                        q: cityInput,
                        appid: API_KEY,
                        units: 'metric'
                    }
                }
            );

            const forecastResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast`,
                {
                    params: {
                        q: cityInput,
                        appid: API_KEY,
                        units: 'metric'
                    }
                }
            );

            setWeatherData(weatherResponse.data);
            setForecastData(forecastResponse.data);
            setLocation({
                latitude: weatherResponse.data.coord.lat,
                longitude: weatherResponse.data.coord.lon
            });
            setError(null);
            setCityInput("");
            setShowSearch(false);
        } catch (err) {
            setError('City not found. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (weatherCode, hour) => {
        // Check if it's night time (between 6 PM and 6 AM) based on provided hour
        const isNightTime = hour >= 18 || hour < 6;

        // Thunderstorm conditions (200-232)
        if (weatherCode >= 200 && weatherCode <= 232) {
            return thunderstorm;
        }

        // Rain and drizzle conditions (300-531)
        if (weatherCode >= 300 && weatherCode <= 531) {
            return rainy;
        }

        // Atmosphere conditions - fog, mist, etc. (701-781)
        if (weatherCode >= 701 && weatherCode <= 781) {
            return fog;
        }

        // Clear sky (800)
        if (weatherCode === 800) {
            return isNightTime ? clear_night : clear_day;
        }

        // Cloudy conditions (801-804)
        if (weatherCode >= 801 && weatherCode <= 804) {
            return isNightTime ? cloudy_night : cloudy_day;
        }

        // Default fallback
        return isNightTime ? cloudy_night : cloudy_day;
    };

    const getTimelineData = () => {
        if (!forecastData) return [];

        const timeline = [];
        const now = new Date();
        let currentHour = now.getHours();

        for (let i = 0; i < 4; i++) {
            const futureHour = (currentHour + (i * 6)) % 24;
            const formattedHour = new Date(now.setHours(futureHour)).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const forecast = forecastData.list.find((item, index) => index === i*2);

            if (forecast) {
                timeline.push({
                    time: formattedHour,
                    weather: forecast.weather[0].main,
                    icon: getWeatherIcon(forecast.weather[0].id, futureHour),
                    temp: Math.round(forecast.main.temp)
                });
            }
        }

        return timeline;
    };

    const formattedDate = currentDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const formattedTime = currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).replace(" AM", "").replace(" PM", "");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl text-white">Loading weather data...</div>
            </div>
        );
    }

    return (
        <div className="main-container w-full md:w-[80vh] h-auto min-h-screen md:h-[80vh] bg-zinc-800 bg-opacity-50 backdrop-blur-sm max-w-4xl md:rounded-3xl md:min-h-[70vh] p-6 md:p-10 shadow-2xl mx-auto">
            <div className="weather-summary flex flex-col md:flex-row justify-between items-center md:items-end font-roboto mb-10 md:mb-7 gap-4 md:gap-0">
                <div className="temp-location relative text-center md:text-left">
                    <div className="temp text-gray-300 text-6xl md:text-5xl">
                        <h1>{weatherData ? `${Math.round(weatherData.main.temp)}°C` : '21°C'}</h1>
                    </div>
                    <div className="location text-xl md:text-lg text-zinc-700 cursor-pointer relative"
                        onMouseEnter={() => setShowSearch(true)}
                        onMouseLeave={() => setShowSearch(false)}
                    >
                        <h1>{weatherData ? weatherData.name : 'Loading...'}</h1>
                        {showSearch && (
                            <div className="absolute left-0 md:left-auto right-0 md:right-auto top-full mt-2 bg-zinc-400 backdrop-blur-lg bg-opacity-60 rounded-lg p-2 z-10 w-[200px] md:min-w-[300px]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={cityInput}
                                        onChange={(e) => setCityInput(e.target.value)}
                                        placeholder="Enter city name..."
                                        className="px-2 py-1 rounded-lg bg-zinc-700 text-gray-300 w-full text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && searchByCity()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={searchByCity}
                                        className="px-2 py-1 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600 text-sm whitespace-nowrap"
                                    >
                                        Search
                                    </button>
                                </div>
                                {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
                            </div>
                        )}
                    </div>
                </div>
                <div className="time-date mb-4 md:mb-0">
                    <div className="time text-5xl md:text-5xl text-gray-300 text-center">
                        <p>{formattedTime}</p>
                    </div>
                    <div className="date text-lg md:text-lg text-zinc-700">
                        <p>{formattedDate}</p>
                    </div>
                </div>
                <div className="weather-icon max-h-20 md:max-h-20 max-w-20 md:max-w-20 text-center">
                    {weatherData && (
                        <>
                            <img
                                src={getWeatherIcon(
                                    weatherData.weather[0].id,
                                    new Date().getHours()
                                )}
                                alt={weatherData.weather[0].description}
                                className="w-20 md:w-auto mx-auto"
                            />
                            <p className="text-base md:text-sm text-gray-300 mt-2">{weatherData.weather[0].main}</p>
                        </>
                    )}
                </div>
            </div>
            <hr className="border-t-2 md:border-t-4 opacity-50 rounded-full md:mb-5" />
            <div className="detailed-weather flex items-center md:items-end justify-between gap-4 md:gap-12 text-center text-gray-300 font-roboto mt-5 mb-10 md:mb-32">
                {getTimelineData().map((timeSlot, index) => (
                    <div key={index} className="time-slot w-1/4 md:w-auto">
                        <p className="text-lg md:text-base mb-2">{timeSlot.weather}</p>
                        <img src={timeSlot.icon} alt="weather-icon" className="my-3 md:my-4 w-12 md:w-16 mx-auto" />
                        <p className="text-base md:text-sm">{timeSlot.time}</p>
                        <p className="text-base md:text-sm mt-2">{timeSlot.temp}°C</p>
                    </div>
                ))}
            </div>
            <hr className="border-t-2 md:border-t-4 opacity-50 rounded-full mb-8 md:mb-6" />
            <div className="other-info grid grid-cols-3 md:flex items-start md:items-end justify-between mt-6 text-center text-gray-300 font-roboto text-base md:text-sm gap-y-8 md:gap-0 px-2 md:px-0">
                <div className="flex flex-col items-center space-y-3 md:space-y-2">
                    <p>Humidity</p>
                    <img src={humidity} alt="humidity" className="w-12 md:w-10 my-2" />
                    <p>{weatherData ? `${weatherData.main.humidity}%` : '--'}</p>
                </div>
                <div className="flex flex-col items-center space-y-3 md:space-y-2">
                    <p>Max/Min</p>
                    <img src={max_min} alt="Maximum and minimum temperature" className="w-12 md:w-10 my-2" />
                    <p>{weatherData ? `${Math.round(weatherData.main.temp_max)}/${Math.round(weatherData.main.temp_min)}°C` : '--'}</p>
                </div>
                <div className="flex flex-col items-center space-y-3 md:space-y-2">
                    <p>Wind</p>
                    <img src={wind} alt="Wind" className="w-12 md:w-10 my-2" />
                    <p>{weatherData ? `${weatherData.wind.speed} m/s` : '--'}</p>
                </div>
                <div className="flex flex-col items-center space-y-3 md:space-y-2">
                    <p>Pressure</p>
                    <img src={pressure} alt="Pressure" className="w-12 md:w-10 my-2" />
                    <p>{weatherData ? `${weatherData.main.pressure} hPa` : '--'}</p>
                </div>
                <div className="flex flex-col items-center space-y-3 md:space-y-2">
                    <p className="whitespace-nowrap">Feels Like</p>
                    <img src={feels_like} alt="FeelsLike" className="w-12 md:w-10 my-2" />
                    <p>{weatherData ? `${Math.round(weatherData.main.feels_like)}°C` : '--'}</p>
                </div>
            </div>
        </div>
    );
}

export default Weather;