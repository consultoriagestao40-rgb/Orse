const API_KEY = "AIzaSyAC3N2c4ByVQ2EycJKbpBcZ-TARIVtHZXU";
const placeId = "ChIJq6qq6L_i3JQRjCgM6y-O39s"; // Exemplo

async function run() {
  console.time('fetch 50 details');
  const promises = [];
  for(let i=0; i<50; i++) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website&key=${API_KEY}`;
    promises.push(fetch(url).then(r => r.json()));
  }
  const results = await Promise.all(promises);
  console.timeEnd('fetch 50 details');
  console.log(results[0].result);
}
run();
