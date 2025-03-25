"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { TravelPlanForm } from "@/components/travel-plan-form";
import { ItineraryList } from "@/components/itinerary-list";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useRouter } from "next/navigation";
import type { Itinerary } from "@/types/itinerary";

export default function Dashboard() {
  const { user } = useAuth();
  const [generatedItineraries, setGeneratedItineraries] = useState<Itinerary[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<any[]>([]);
  const [recommendedItineraries, setRecommendedItineraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("User data received in Dashboard:", user);
    if (user === undefined) return; // Wait for user data to load
    if (!user) {
      console.warn("User not found, redirecting to login...");
      router.push("/");
    } else {
      // Fetch saved itineraries when user data is available
      fetchSavedItineraries();
      // Fetch recommended itineraries from Excel
      fetchRecommendedItineraries();
    }
  }, [user, router]);

  // Handle newly generated itineraries
  const handleItinerariesGenerated = (newItineraries: Itinerary[]) => {
    setGeneratedItineraries(newItineraries);
  };

  // Function to fetch saved itineraries
  const fetchSavedItineraries = async () => {
    if (!user || !user._id) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching saved itineraries for user:", user._id);
      
      const response = await fetch(`/api/display_saved?userId=${user._id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Saved itineraries retrieved:", data.itineraries);
      setSavedItineraries(data.itineraries);
    } catch (error) {
      console.error("Failed to fetch saved itineraries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch recommended itineraries from Excel
  const fetchRecommendedItineraries = async () => {
    if (!user || !user._id) return;
    
    try {
      setIsLoadingRecommendations(true);
      console.log("Fetching recommended itineraries for user:", user._id);
      
      const response = await fetch(`/api/recommended_itineraries?userId=${user._id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Recommended itineraries retrieved:", data.recommendations);
      setRecommendedItineraries(data.recommendations);
    } catch (error) {
      console.error("Failed to fetch recommended itineraries:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Function to handle rating an itinerary
  const rateItinerary = async (itineraryText) => {
    try {
      // Show rating modal
      const rating = await showRatingModal();
      
      if (!rating) return; // User canceled the rating
      
      // Get current user ID
      const userId = user._id;
      
      // Send rating to the server
      const response = await fetch('/api/rate_itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itineraryText,
          userId,
          rating
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      alert('Thank you for rating this itinerary!');
      console.log('Rating submitted:', result);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  // Function to save a recommended itinerary
  const saveRecommendedItinerary = async (itineraryText) => {
    if (!user?._id) {
      console.error("❌ Error: User ID is missing.");
      return;
    }
  
    try {
      const response = await fetch('/api/save_itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          itineraryText, // Updated key name to match the API
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error(`❌ Server Error (${response.status}):`, result);
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }
  
      alert('✅ Itinerary saved successfully!');
      console.log('📜 Itinerary saved:', result);
  
      // Refresh saved itineraries
      fetchSavedItineraries();
      
    } catch (error) {
      console.error('❌ Error saving itinerary:', error);
      alert('⚠️ Failed to save itinerary. Please try again.');
    }
  };
  

  // Helper function to show a rating modal
  const showRatingModal = () => {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      // Create modal content
      modalContainer.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Rate This Itinerary</h2>
          <p class="mb-4">How would you rate this travel plan?</p>
          <div class="flex justify-center space-x-2 mb-6">
            ${[1, 2, 3, 4, 5].map(num => 
              `<button class="rating-btn w-12 h-12 rounded-full border-2 border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black" data-rating="${num}">${num}</button>`
            ).join('')}
          </div>
          <div class="flex justify-end space-x-4">
            <button class="cancel-btn px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">Cancel</button>
          </div>
        </div>
      `;
      
      // Add to DOM
      document.body.appendChild(modalContainer);
      
      // Add event listeners
      const ratingButtons = modalContainer.querySelectorAll('.rating-btn');
      ratingButtons.forEach(button => {
        button.addEventListener('click', () => {
          const rating = parseInt(button.getAttribute('data-rating'));
          document.body.removeChild(modalContainer);
          resolve(rating);
        });
      });
      
      // Cancel button
      const cancelButton = modalContainer.querySelector('.cancel-btn');
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      });
      
      // Close on outside click
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          document.body.removeChild(modalContainer);
          resolve(null);
        }
      });
    });
  };

  // Placeholder functions for other features
  const getWeather = async (itineraryText: string) => {
    // API key - replace with your actual OpenWeatherMap API key
    const API_KEY = 'f0b6214eef841c7df38b1d12c375c1e8';
  
    // Function to extract specific locations
    const extractLocations = (text: string): string[] => {
      const locations = [];
      const locationRegexes = [
        /\b(Goa)\b/i,
        /\b(Ladakh)\b/i,
        /\b(Leh)\b/i
      ];
  
      locationRegexes.forEach(regex => {
        const match = text.match(regex);
        if (match) {
          locations.push(match[1]);
        }
      });
  
      return locations;
    };
  
    // Extract locations from itinerary
    const locations = extractLocations(itineraryText);
  
    if (locations.length === 0) {
      alert('No specific locations found for weather forecast.');
      return;
    }
  
    try {
      const forecastPromises = locations.map(async (location) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`
        );
  
        if (!response.ok) {
          throw new Error(`Forecast data not available for ${location}`);
        }
  
        const data = await response.json();
        
        // Group forecast by day (taking the forecast for midday each day)
        const dailyForecasts = data.list.reduce((acc, forecast) => {
          const date = new Date(forecast.dt * 1000);
          const dateKey = date.toISOString().split('T')[0];
          
          // Select forecasts around midday (11:00-14:00)
          if (date.getUTCHours() >= 11 && date.getUTCHours() <= 14) {
            if (!acc[dateKey]) {
              acc[dateKey] = {
                date: dateKey,
                temperature: forecast.main.temp,
                description: forecast.weather[0].description,
                humidity: forecast.main.humidity,
                windSpeed: forecast.wind.speed,
                icon: forecast.weather[0].icon
              };
            }
          }
          
          return acc;
        }, {});
  
        // Convert to array and limit to 4 days
        const forecastArray = Object.values(dailyForecasts)
          .slice(0, 4)
          .map(day => ({
            ...day,
            formattedDate: new Date(day.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })
          }));
  
        return {
          location: location,
          forecasts: forecastArray
        };
      });
  
      const forecastResults = await Promise.all(forecastPromises);
  
      // Create a modal to display forecast information
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      modalContainer.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 class="text-2xl font-bold mb-4">4-Day Weather Forecast</h2>
          ${forecastResults.map(result => `
            <div class="mb-4 p-4 border rounded">
              <h3 class="font-semibold text-lg">${result.location}</h3>
              ${result.forecasts.map(day => `
                <div class="flex items-center justify-between border-b py-2">
                  <span class="font-medium">${day.formattedDate}</span>
                  <img 
                    src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
                    alt="Weather icon" 
                    class="w-12 h-12"
                  />
                  <div>
                    <p>🌡️ ${day.temperature.toFixed(1)}°C</p>
                    <p>☁️ ${day.description}</p>
                    <p>💧 Humidity: ${day.humidity}%</p>
                    <p>💨 Wind: ${day.windSpeed.toFixed(1)} m/s</p>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          <button class="close-btn px-4 py-2 bg-black text-white rounded-lg mt-4">Close</button>
        </div>
      `;
  
      document.body.appendChild(modalContainer);
  
      // Add close button functionality
      const closeButton = modalContainer.querySelector('.close-btn');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
  
      // Close on outside click
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          document.body.removeChild(modalContainer);
        }
      });
  
    } catch (error) {
      console.error('Forecast fetch error:', error);
      alert('Failed to fetch weather forecast. Please try again.');
    }
  };

 const getTripRoute = async (itineraryText: string) => {
    // OpenRouteService API key (free tier)
    const ORS_API_KEY = '5b3ce3597851110001cf62485d2496f98a1c4b1f89b71df05760b43c';

    // Detailed Goa locations with coordinates
    const goaLocations = {
        // North Goa Locations
        'Aguada Fort': { name: 'Aguada Fort', coordinates: [73.7683, 15.5049] },
        'Baga Beach': { name: 'Baga Beach', coordinates: [73.7518, 15.5580] },
        'Candolim Beach': { name: 'Candolim Beach', coordinates: [73.7615, 15.5110] },
        'Calangute Beach': { name: 'Calangute Beach', coordinates: [73.7518, 15.5465] },
        'Arambol Beach': { name: 'Arambol Beach', coordinates: [73.6878, 15.6528] },
        'Museum of Goa': { name: 'Museum of Goa', coordinates: [73.7725, 15.5056] },
        'Chapora Fort': { name: 'Chapora Fort', coordinates: [73.6948, 15.6095] },
        
        // Panaji Locations
        'Reis Magos Fort': { name: 'Reis Magos Fort', coordinates: [73.8047, 15.5057] },
        'Basilica of Bom Jesus': { name: 'Basilica of Bom Jesus', coordinates: [73.9118, 15.5007] },
        'Immaculate Conception Church': { name: 'Immaculate Conception Church', coordinates: [73.8312, 15.4989] },
        'Miramar Beach': { name: 'Miramar Beach', coordinates: [73.8312, 15.4680] },
        'Dona Paula': { name: 'Dona Paula', coordinates: [73.8009, 15.4630] },
        
        // South Goa Locations
        'Indian Naval Aviation Museum': { name: 'Indian Naval Aviation Museum', coordinates: [73.8313, 15.2993] },
        'Majorda Beach': { name: 'Majorda Beach', coordinates: [73.8401, 15.2793] },
        'Colva Beach': { name: 'Colva Beach', coordinates: [73.9119, 15.2767] },
        'Cabo De Rama Fort': { name: 'Cabo De Rama Fort', coordinates: [73.9447, 15.1088] }
    };

    // Function to extract locations mentioned in the text
    const extractLocations = (text: string) => {
        const foundLocations = [];
        const unroutedLocations = [];

        // Split the itinerary into parts for more flexible matching
        const textParts = text.split(/[,\s-]+/);

        for (const [locationName, locationData] of Object.entries(goaLocations)) {
            // More flexible matching
            const regex = new RegExp(`\\b(${locationName})\\b`, 'i');
            const isMatch = textParts.some(part => regex.test(part));

            if (isMatch) {
                foundLocations.push(locationData);
            }
        }

        // Collect locations that weren't matched
        const matchedLocationNames = foundLocations.map(loc => loc.name.toLowerCase());
        textParts.forEach(part => {
            const normalizedPart = part.toLowerCase();
            if (normalizedPart.length > 2 && !matchedLocationNames.includes(normalizedPart)) {
                unroutedLocations.push(part);
            }
        });

        return { routedLocations: foundLocations, unroutedLocations };
    };

    // Haversine formula for distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Traveling Salesman Problem solver using nearest neighbor algorithm
    const solveTSP = (locations) => {
        if (locations.length <= 1) return locations;

        const unvisited = [...locations];
        const route = [unvisited.shift()];

        while (unvisited.length > 0) {
            const lastLocation = route[route.length - 1];
            let nearestLocation = null;
            let minDistance = Infinity;

            for (const location of unvisited) {
                const distance = calculateDistance(
                    lastLocation.coordinates[1], 
                    lastLocation.coordinates[0], 
                    location.coordinates[1], 
                    location.coordinates[0]
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestLocation = location;
                }
            }

            route.push(nearestLocation);
            unvisited.splice(unvisited.indexOf(nearestLocation), 1);
        }

        return route;
    };

    // Function to get route between two points
    const getRoutesBetweenPoints = async (locations) => {
        const routes = [];
        const fullRouteCoordinates = [];

        for (let i = 0; i < locations.length - 1; i++) {
            try {
                const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                        'Content-Type': 'application/json',
                        'Authorization': ORS_API_KEY
                    },
                    body: JSON.stringify({
                        coordinates: [
                            locations[i].coordinates,
                            locations[i+1].coordinates
                        ]
                    })
                });

                if (!response.ok) {
                    console.warn(`Routing failed between ${locations[i].name} and ${locations[i+1].name}`);
                    continue;
                }

                const routeData = await response.json();
                
                // Extract route geometry
                const routeGeometry = routeData.routes[0].geometry;
                const decodedGeometry = decodeOrsGeometry(routeGeometry);
                fullRouteCoordinates.push(...decodedGeometry);

                routes.push({
                    start: locations[i].name,
                    end: locations[i+1].name,
                    distance: routeData.routes[0].summary.distance / 1000, // Convert to kilometers
                    duration: routeData.routes[0].summary.duration / 3600, // Convert to hours
                    geometry: decodedGeometry
                });
            } catch (error) {
                console.warn(`Route fetch error between ${locations[i].name} and ${locations[i+1].name}:`, error);
            }
        }

        return { routes, fullRouteCoordinates };
    };

    // Decode OpenRouteService geometry
    const decodeOrsGeometry = (encodedGeometry) => {
        const precision = 1e5;
        const coordinates = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

        while (index < encodedGeometry.length) {
            let result = 1;
            let shift = 0;
            let byte;
            let dLat = 0;
            let dLng = 0;

            do {
                byte = encodedGeometry.charCodeAt(index++) - 63;
                dLat += (byte & 0x1f) * result;
                result *= 0x20;
            } while (byte >= 0x20);

            if (dLat & 1) dLat = ~(dLat >> 1);
            else dLat >>= 1;

            result = 1;
            do {
                byte = encodedGeometry.charCodeAt(index++) - 63;
                dLng += (byte & 0x1f) * result;
                result *= 0x20;
            } while (byte >= 0x20);

            if (dLng & 1) dLng = ~(dLng >> 1);
            else dLng >>= 1;

            lat += dLat;
            lng += dLng;

            coordinates.push([lng / precision, lat / precision]);
        }

        return coordinates;
    };

    try {
        // Extract locations from the itinerary
        const { routedLocations, unroutedLocations } = extractLocations(itineraryText);

        if (routedLocations.length === 0) {
            alert('No specific locations found in the itinerary.');
            return;
        }

        // Solve TSP to get optimized route
        const optimizedRoute = solveTSP(routedLocations);

        // Get detailed routes between points
        const { routes, fullRouteCoordinates } = await getRoutesBetweenPoints(optimizedRoute);

        // Calculate total distance and duration
        const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);
        const totalDuration = routes.reduce((sum, route) => sum + route.duration, 0);

        // Create modal with map
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modalContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg max-w-4xl w-full h-[80vh] flex flex-col">
                <h2 class="text-2xl font-bold mb-4">Optimized Goa Trip Route</h2>
                <div id="map" class="flex-grow rounded-lg"></div>
                <div class="mt-4">
                    <h3 class="font-semibold text-lg">Route Details</h3>
                    ${routes.map(route => `
                        <div class="border-b py-2">
                            <p>📍 ${route.start} to ${route.end}</p>
                            <p>📏 Distance: ${route.distance.toFixed(1)} km</p>
                            <p>⏱️ Duration: ${route.duration.toFixed(1)} hours</p>
                        </div>
                    `).join('')}
                    <div class="mt-2">
                        <p>📏 Total Distance: ${totalDistance.toFixed(1)} km</p>
                        <p>⏱️ Total Estimated Duration: ${totalDuration.toFixed(1)} hours</p>
                    </div>
                    ${unroutedLocations.length > 0 ? `
                    <div class="mt-2 text-gray-600">
                        <p>Note: Some locations could not be routed: ${unroutedLocations.join(', ')}</p>
                    </div>
                    ` : ''}
                </div>
                <button class="close-btn px-4 py-2 bg-black text-white rounded-lg mt-4">Close</button>
            </div>
        `;

        document.body.appendChild(modalContainer);

        // Dynamically load Leaflet
        const loadLeaflet = () => {
            return new Promise((resolve, reject) => {
                // Check if Leaflet is already loaded
                if (window.L) {
                    resolve(window.L);
                    return;
                }

                // Load Leaflet CSS
                const leafletCSS = document.createElement('link');
                leafletCSS.rel = 'stylesheet';
                leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
                document.head.appendChild(leafletCSS);

                // Load Leaflet JS
                const leafletScript = document.createElement('script');
                leafletScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
                leafletScript.onload = () => resolve(window.L);
                leafletScript.onerror = reject;
                document.body.appendChild(leafletScript);
            });
        };

        // Initialize map after Leaflet is loaded
        loadLeaflet().then((L) => {
            // Initialize map
            const map = L.map('map').setView([15.4909, 73.8278], 10);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add route line if coordinates exist
            if (fullRouteCoordinates.length > 0) {
                const routePolyline = L.polyline(fullRouteCoordinates, {
                    color: 'blue',
                    weight: 5,
                    opacity: 0.7
                }).addTo(map);

                // Fit map to route bounds
                map.fitBounds(routePolyline.getBounds());
            }

            // Add markers for each location
            optimizedRoute.forEach((location, index) => {
                const marker = L.marker(location.coordinates.slice().reverse()).addTo(map);
                marker.bindPopup(`${index + 1}. ${location.name}`);
            });
        }).catch((error) => {
            console.error('Failed to load Leaflet:', error);
        });

        // Add close button functionality
        const closeButton = modalContainer.querySelector('.close-btn');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });

    } catch (error) {
        console.error('Goa route error:', error);
        alert('Failed to generate Goa trip route. Please try again.');
    }
};
  
  if (!user || !user._id) {
    return <div className="container mx-auto p-4 text-center">Loading user data...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.name || "Traveler"}!</h1>
          <TravelPlanForm onItinerariesGenerated={handleItinerariesGenerated} userId={user._id} />
        </div>
        
        {generatedItineraries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Generated Itineraries</h2>
            <ItineraryList itineraries={generatedItineraries} userId={user._id} onSave={fetchSavedItineraries} />
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
          {isLoadingRecommendations ? (
            <p>Loading recommendations...</p>
          ) : recommendedItineraries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedItineraries.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${item.isGeneric ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.isGeneric ? 'Generic Recommendation' : 'Personalized'}
                    </span>
                    {item.matchScore && (
                      <span className="text-sm text-gray-600">{Math.round(item.matchScore * 100)}% match</span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap mb-4">{item.itinerary}</div>
                  <div className="flex space-x-4 mt-4">
                    <button 
                      className="px-4 py-2 bg-black text-white rounded-lg hover:from-blue-600 hover:to-indigo-700" 
                      onClick={() => saveRecommendedItinerary(item.itinerary)}
                    >
                      Save to My Itineraries
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recommendations available yet. Continue using the platform to get personalized recommendations!</p>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Saved Itineraries</h2>
          {isLoading ? (
            <p>Loading saved itineraries...</p>
          ) : savedItineraries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedItineraries.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 shadow-sm">
                  <div className="whitespace-pre-wrap">{item.itinerary}</div>
                  <div className="flex space-x-4 mt-4">
                    <button className="px-4 py-2 bg-black text-white rounded-lg" onClick={() => rateItinerary(item.itinerary)}>
                      Rate Itinerary
                    </button>
                    <button className="px-4 py-2 bg-black text-white rounded-lg" onClick={() => getWeather(item.itinerary)}>
                      Get Weather
                    </button>
                    <button className="px-4 py-2 bg-black text-white rounded-lg" onClick={() => getTripRoute(item.itinerary)}>
                      Get Trip Route
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No saved itineraries yet. Generate and save some travel plans!</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}