// npm install node-fetch@2
// up to date node-fetch doesn't work with most updated express???
const fetch = require('node-fetch');

/* API Key: 2d27cf9efb8f4b5a842225540232104
endpoint: http://api.weatherapi.com/v1/forecast.json?key=2d27cf9efb8f4b5a842225540232104&q=San Diego&days=1&aqi=yes
params:
    q: location
    aqi=yes: include aqi
    days: (default 7)
*/

//store api key in .env file!
const API_KEY = '2d27cf9efb8f4b5a842225540232104'

const weatherController = {};


weatherController.getWeather = async (req, res, next) => {
  // location to grab weather for stored on req.params, spaces that exist location name are required in fetch req below (i.e. San Diego)
  const locationId = req.params.location;
  
  const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${locationId}&days=7&aqi=yes`)
    .then(res => res.json())
    .then(result => {
        // console.log(result)
        return result;
    })
    .catch(err => {
      return next({
        log: `weatherController.getWeather: ${err}`,
        message: { err: 'Error fetching weather data' }
      });
    })
    // deconstructing necessary weather stats from returned weather data
    const { location, current, forecast } = response;
    const { name, region, localtime } = location;
    const { last_updated, temp_f, temp_c, condition, humidity, precip_in, gust_mph, wind_mph, air_quality } = current;
    // daily/hourly forecast -> hourly for current day, daily conditions for rest of the week
    const eachDay = []
    for (let i = 0; i < forecast.forecastday.length; i++) {
      const currDay = forecast.forecastday[i]
      const { date, day } = currDay
      const { maxtemp_f, mintemp_f, avgtemp_f, condition } = day
      const newObj = {
        date,
        day: { maxtemp_f, mintemp_f, avgtemp_f, condition }
      }
      if (i === 0) {
        const { hour, astro } = currDay
        const { sunrise, sunset } = astro
        const hourly = []
        hour.forEach(eachHour => {
          const { time, temp_c, temp_f, condition } = eachHour
          hourly.push({ time, temp_c, temp_f, condition })
        })
        newObj.hour = hourly
        newObj.astro = { sunrise, sunset }
      }
      eachDay.push(newObj)
      continue
    }  

    // data returned to front end
    const object = {
      location: { name, region, localtime },
      condition: condition,
      current: { last_updated, temp_f, temp_c, humidity, precip_in, gust_mph, wind_mph, air_quality },
      day: eachDay
    }
    console.log(object);
    res.locals.stats = object;
    return next();

}

// get weather data for each location in user's saved locations array
weatherController.getSavedWeather = async (req, res, next) => {
  const savedLocationArray = res.locals.savedLocation;
  const dataArray = [];
  if (!savedLocationArray.length) return next('There are no saved locations!');

  // for each location in array, send location name, current temp, high temp, low temp, current condition/graphic
  await savedLocationArray.forEach( async (locationElement) => {
    const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${locationElement}&days=1`)
    .then(res => res.json())
    .then(result => {
        // console.log(result);
        return result;
    })
    .catch(err => {
      return next({
        log: `weatherController.getSavedWeather: ${err}`,
        message: { err: 'Error fetching weather data' }
      });
    })

      const { location, current, forecast } = response;
      const { name, region, country, localtime } = location;
      const { temp_f, temp_c, condition } = current;
      const max_temp = forecast.forecastday[0].day.maxtemp_f;
      const min_temp = forecast.forecastday[0].day.mintemp_f;
      const avg_temp = forecast.forecastday[0].day.avgtemp_f;

      const object = {
        location: { name, region, country, localtime },
        condition: condition,
        current: { temp_f, temp_c },
        max: max_temp,
        min: min_temp,
        avg: avg_temp,
      }

      dataArray.push(object);
  })

  // for each location in array, send location name, current temp, high temp, low temp, current condition/graphic
  for (let locationElement of savedLocationArray) {
    const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${locationElement}&days=1&aqi=yes`)
    .then(res => res.json())
    .then(result => {
        // console.log(result);
        return result;
    })
    .catch(err => {
      return next({
        log: `weatherController.getSavedWeather: ${err}`,
        message: { err: 'Error fetching weather data' }
      });
    })
   
      const { location, current, forecast } = response;
      const { name, region, country, localtime } = location;
      const { temp_f, temp_c, condition, air_quality } = current;
      const max_temp = forecast.forecastday[0].day.maxtemp_f;
      const min_temp = forecast.forecastday[0].day.mintemp_f;
      const avg_temp = forecast.forecastday[0].day.avgtemp_f;

      const object = {
        location: { name, region, country, localtime },
        condition: condition,
        current: { temp_f, temp_c, air_quality },
        max: max_temp,
        min: min_temp,
        avg: avg_temp,
      }
      // console.log(object);
      dataArray.push(object);
  }
  
  res.locals.dataArray = dataArray;
  // console.log('this is the final dataArray, ', res.locals.dataArray);
  return next();

}




// export controller
module.exports = weatherController;