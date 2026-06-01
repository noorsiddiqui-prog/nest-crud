import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    // hash the password
    try {
      const hash = await argon.hash(dto.password);
      // save the new user in the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
          firstName: '',
          lastName: '',
        },
      });
      // return the saved user
      // remove the hash from the returned user object

      //   const { hash: hashedPass, ...safeUser } = user;
      //   return safeUser;

      return this.signToken(user.id, user.email);
    } catch (error) {
      console.log(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials already taken');
        }
      }
      throw new Error('An error occurred while signing up');
    }
  }

  async signin(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!user) {
        throw new ForbiddenException('Invalid email or password');
      }

      const passwordMatches = await argon.verify(user.hash, dto.password);

      if (!passwordMatches) {
        throw new ForbiddenException('Invalid email or password');
      }

      //   const { hash, ...safeUser } = user;
      //   return safeUser;
      return this.signToken(user.id, user.email);
    } catch (error) {
      console.error('Signin error:', error);

      // Re-throw NestJS exceptions
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while signing in',
      );
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{
    access_token: string;
  }> {
    const data = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwtService.signAsync(data, {
      expiresIn: '15m',
      secret,
    });

    return {
      access_token: token,
    };
  }
}
