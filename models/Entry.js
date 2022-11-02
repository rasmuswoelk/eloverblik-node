/**
* Model -> Entry
 */

import { Schema, model } from 'mongoose';

const EntrySchema = new Schema({
    meterId: {
      type: Schema.Types.String,
      required: true,
    },
    type: {
      type: Schema.Types.String,
      emum: ['day'],
    },
    start: {
      type: Schema.Types.Date
    },
    end: {
      type: Schema.Types.Date
    },
    hours: [
      {
        quantity: Schema.Types.Number,
        // quantity: Schema.Types.Decimal128,
        quantityString: Schema.Types.String,
        quality: Schema.Types.String,
        hour: Schema.Types.Number,
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform:  (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  }
);

export default model('Entry', EntrySchema);
