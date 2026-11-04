const API_KEY = "AIzaSyAC3N2c4ByVQ2EycJKbpBcZ-TARIVtHZXU";
const query = encodeURIComponent("Mercado em curitiba");
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.results && data.results.length > 0) {
      console.log(Object.keys(data.results[0]));
      console.log(data.results[0].formatted_phone_number);
      console.log(data.results[0].website);
    }
  });
