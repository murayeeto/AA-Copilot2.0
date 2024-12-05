import React, { useState, useEffect } from "react";
import axios from "axios";

export const ItineraryPlanner = ({ userId }) => {
  const [itinerary, setItinerary] = useState([]);
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(3); // Default duration: 3 days
  const [useLastSaved, setUseLastSaved] = useState(false);
  const [saveItinerary, setSaveItinerary] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useLastSaved) {
      fetchLastSavedLocation();
    }
  }, [useLastSaved]);

  const fetchLastSavedLocation = async () => {
    try {
      setError("");
      const response = await axios.post("http://localhost:5000/chat", {
        prompt: "Where did my last flight land?",
        user_id: userId,
      });

      const locationResponse = response.data.response.match(/landed at (.+?)\./);
      if (locationResponse) {
        setLocation(locationResponse[1]);
      } else {
        setError("Unable to determine your last saved location.");
      }
    } catch (err) {
      console.error("Error fetching last saved location:", err);
      setError("Failed to fetch last saved location. Please try again.");
    }
  };

  const generateItinerary = async () => {
    if (!location && !useLastSaved) {
      setError("Please provide a location or select 'Use Last Saved Location'.");
      return;
    }

    if (duration <= 0) {
      setError("Please provide a valid number of days.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        prompt: `Create a ${duration}-day itinerary for ${location}. Include landmarks, restaurants, and activities.`,
        user_id: userId,
      });

      const generatedItinerary = response.data.response
        .split("\n")
        .filter((line) => line.trim() !== "");

      setItinerary(generatedItinerary);

      if (saveItinerary) {
        saveItineraryToDatabase();
      }
    } catch (err) {
      console.error("Error generating itinerary:", err);
      setError("Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveItineraryToDatabase = async () => {
    try {
      await axios.post("http://localhost:5000/save-itinerary", {
        user_id: userId,
        location,
        duration,
        itinerary,
      });
      alert("Itinerary saved successfully!");
    } catch (err) {
      console.error("Error saving itinerary:", err);
      setError("Failed to save itinerary.");
    }
  };

  return (
    <div id="itinerary-planner" style={{ paddingBottom: "50px" }}>
      <h2>Itinerary Planner</h2>
      <div>
        <label>
          <input
            type="checkbox"
            checked={useLastSaved}
            onChange={(e) => setUseLastSaved(e.target.checked)}
          />
          Use Last Saved Location ({location || "No saved location yet"})
        </label>
        {!useLastSaved && (
          <input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}
        <input
          type="number"
          placeholder="Number of days"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          min="1"
        />
        <label>
          <input
            type="checkbox"
            checked={saveItinerary}
            onChange={(e) => setSaveItinerary(e.target.checked)}
          />
          Save Itinerary
        </label>
        <button onClick={generateItinerary} disabled={loading}>
          {loading ? "Generating..." : "Generate Itinerary"}
        </button>
        {error && <p className="text-danger">{error}</p>}
      </div>
      <h3>Generated Itinerary</h3>
      <ul>
        {itinerary.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};
