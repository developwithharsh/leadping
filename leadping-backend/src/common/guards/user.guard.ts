import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user_id = request.body?.user_id || request.query?.user_id;

    if (!user_id) {
      throw new UnauthorizedException('user_id required');
    }

    if (!isValidObjectId(user_id)) {
      throw new UnauthorizedException('Invalid user');
    }

    const user = await this.userModel.findById(user_id).lean();
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    request['user'] = user;
    return true;
  }
}
