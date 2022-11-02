import Entry from './models/Entry.js';
import connect from './database/connect.js';
import mongoose from 'mongoose';
import { format } from 'date-fns';

const KWH_PRICE = 5.018;

export const getReport = async () => {
  await connect()
  const entries = await Entry.find().sort('start');

  console.log(`Found ${entries.length} days – From ${format(entries[0].start, 'dd-MM-yyyy')} to ${format(entries[entries.length - 1].end, 'dd-MM-yyyy')}`);
  console.log('\n');
  console.log('Price per kWh: ', KWH_PRICE, 'DKK');
  console.log('\n');
  
  // Find date with the highest consumption
  const { date, consumption } = entries.reduce((acc, entry) => {
    const { hours } = entry;
    const consumption = hours.reduce((acc, hour) => acc + hour.quantity, 0);
    
    if (consumption > acc.consumption) {
      return {
        date: entry.start,
        consumption,
      }
    }
    
    return acc;
  }, {
    date: null,
    consumption: 0,
  })

  console.log(`Date with highest consumption: ${format(date, 'dd-MM-yyyy')} with`, Number(consumption.toFixed(2)), `kWh (${(consumption * KWH_PRICE).toFixed(2)} DKK)`);

  // Get average consumption per hour
  const totalConsumptionPerHour = entries.reduce((acc, entry) => {
    const { hours } = entry;
    hours.forEach(hour => {
      if (!acc[hour.hour]) {
        acc[hour.hour] = 0;
      }
      
      acc[hour.hour] += hour.quantity;
    })
    
    return acc;
  }, {})

  
  console.log('\n');
  console.log('Average consumption per hour:');

  let averagePerDay = 0;

  Object.entries(totalConsumptionPerHour).forEach(([hour, consumption], index) => {
    if (index < 24) {
      averagePerDay += consumption;
      console.log(`${hour - 1}:00`, Number((consumption / entries.length).toFixed(2)), `kWh (${((consumption / entries.length) * KWH_PRICE).toFixed(2)} DKK)`);
    }
  })

  console.log('\n');

  averagePerDay = averagePerDay / entries.length;

  const averagePerMonth = averagePerDay * 30;

  console.log('Average per day:', averagePerDay, `kWh (${(averagePerDay * KWH_PRICE).toFixed(2)} DKK)`);
  console.log(`Average per month:`, averagePerMonth,  `kWh (${(averagePerMonth * KWH_PRICE).toFixed(2)} DKK)`);
  mongoose.connection.close()
}
