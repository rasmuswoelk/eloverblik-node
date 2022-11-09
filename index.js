import axios from 'axios';
import mongoose from 'mongoose';
import connect from './database/connect.js';
import { differenceInDays, format, parseISO, startOfYesterday } from 'date-fns';
import Entry from './models/Entry.js';
import dotenv from 'dotenv';
import { getReport } from './report.js';

dotenv.config();

const START_DATE = process.env.DEFAULT_START_DATE;
const END_DATE = format(new Date(), 'yyyy-MM-dd');
const METERING_POINT_ID = process.env.METERING_POINT_ID;

const run = async () => {
  // Connect to mongodb
  await connect();

  // Check date of the latest entry
  const latest = await Entry.findOne().sort({ start: -1 });

  let from;

  // No entries in the database; use our fixed start date
  if (!latest) {
    from = START_DATE;

  // Check if there are any new entries
  // Note: Data from eloverblik.dk is not always one day behind
  } else {
    const daysSinceLast = differenceInDays(latest.start, startOfYesterday())

    if (Math.abs(daysSinceLast) > 1) {
      from = format(latest.end, 'yyyy-MM-dd');
    }
  }

  // No from; abort
  if (!from) {
    console.log('No new entries; skipping');
  } else {
    console.log(`Fetching entries from ${from} to ${END_DATE}`);

    // Fetch days in given time interval
    try {
      const response = await axios({
        url: `https://api.eloverblik.dk/customerapi/api/meterdata/gettimeseries/${from}/${END_DATE}/Hour`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.REFRESH_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          meteringPoints: {
            meteringPoint: [
              METERING_POINT_ID
            ]
          }
        }
      })
  
      const { 
        data: { 
          result: [
            { 
              MyEnergyData_MarketDocument: { 
                TimeSeries: [
                  {
                    Period: days
                  }
                ]
              } 
            }
          ] 
        } 
      } = response;
  
      // Parse data
      const entries = days.map(({ timeInterval: { start, end }, Point }) => {
        const hours = Point.map(hour => {
          return {
            hour: Number(hour.position),
            quality: hour['out_Quantity.quality'],
            quantity: Number(hour['out_Quantity.quantity']),
            quantityString: hour['out_Quantity.quantity']
          }
        })
  
        return {
          meterId: METERING_POINT_ID,
          end: parseISO(end),
          hours,
          start: parseISO(start),
          type: 'day',
        }
      });
  
      console.log(`Fetched ${entries.length} entries`);
      
      // Create missing entries
      if (entries.length) {
        await Entry.create(entries);
        console.log('Created entries in database')
      }
    } catch (error) {
      console.log('Error', error)
    }
  }

  // Close DB connection
  mongoose.connection.close()

  console.log('\n');

  // Get report
  await getReport();

  console.log('\n');
}

run();