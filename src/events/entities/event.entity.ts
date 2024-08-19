import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Event extends Document {
  @Prop()
  type: string;

  @Prop({ index: true })
  name: string;

  @Prop({ type: SchemaTypes.Mixed })
  payload: Record<string, any>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
