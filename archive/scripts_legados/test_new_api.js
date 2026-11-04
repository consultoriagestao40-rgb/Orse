const API_KEY = "AIzaSyAC3N2c4ByVQ2EycJKbpBcZ-TARIVtHZXU";

async function run() {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const data = {
    textQuery: 'Mercado em curitiba',
    pageSize: 20
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,nextPageToken'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
}
run();
