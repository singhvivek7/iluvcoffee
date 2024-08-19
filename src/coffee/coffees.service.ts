import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Coffee } from './entities/coffee.entity';
import { Connection, Model } from 'mongoose';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Event } from 'src/events/entities/event.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectModel(Coffee.name) private readonly coffeeModel: Model<Coffee>,
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  findAll(paginationQueryDto: PaginationQueryDto): Promise<Coffee[]> {
    const { limit = 10, offset = 0 } = paginationQueryDto;

    return this.coffeeModel.find().skip(offset).limit(limit).exec();
  }

  async findOne(id: string): Promise<Coffee> {
    const coffee = await this.coffeeModel.findById(id).exec();
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee;
  }

  create(createCoffeeDto: CreateCoffeeDto): Promise<Coffee> {
    const createdCoffee = new this.coffeeModel(createCoffeeDto);
    return createdCoffee.save();
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeeDto): Promise<Coffee> {
    const updatedCoffee = await this.coffeeModel
      .findByIdAndUpdate(id, updateCoffeeDto, { new: true })
      .exec();
    if (!updatedCoffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return updatedCoffee;
  }

  async remove(id: string): Promise<Coffee> {
    const deletedCoffee = await this.coffeeModel.findByIdAndDelete(id).exec();
    if (!deletedCoffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return deletedCoffee;
  }

  async seedCoffees(): Promise<Coffee[]> {
    const coffees = [
      {
        name: 'Colombian',
        brand: 'Buddy Brew',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Latte',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Capuccino',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Mocha',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Espresso',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Cappuccino',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
      {
        name: 'Mocha',
        brand: 'Starbucks',
        flavors: ['chocolate', 'vanilla'],
      },
    ];
    return this.coffeeModel.insertMany(coffees);
  }

  async deleteAll(): Promise<string> {
    const deleted = await this.coffeeModel.deleteMany().exec();

    return `Deleted all #${deleted.deletedCount} coffees`;
  }

  async recommendCoffees(id: string): Promise<void> {
    const coffee = await this.findOne(id);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      coffee.recommendations++;

      const recommendedEvent = new this.eventModel({
        name: 'coffee-recommendation',
        type: 'coffee-recommendation',
        payload: { coffeeId: coffee.id },
      });

      await recommendedEvent.save({ session });
      await coffee.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
