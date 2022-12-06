import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcryptjs'
import { JwtPayload, Tokens } from './types';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(authDto: AuthDto, res: Response): Promise<Tokens> {
    const condidate = await this.prismaService.user.findUnique({
        where: {
            email: authDto.email
        }
    })
    if(condidate){
        throw new BadRequestException("Bunday email mavjud")
    }

    const hashedPassword = await bcrypt.hash(authDto.password, 7)
    const newUser = await this.prismaService.user.create({
        data: {
            email: authDto.email,
            hashedPassword
        }
    })
    const tokens = await this.getTokens(newUser.id, newUser.email)
    await this.updateRefreshTokenHash(newUser.id, tokens.refresh_token)
    res.cookie("refresh_token", tokens.refresh_token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    })
    return tokens
  }


  async signin(authDto: AuthDto, res: Response): Promise<Tokens> {
    const {email, password} = authDto
    const user = await this.prismaService.user.findUnique({
        where: {email}
    })

    if(!user){
        throw new ForbiddenException("Access Denide")
    }


    const passwordMatches = await bcrypt.compare(password, user.hashedPassword)
    if(!passwordMatches) throw new ForbiddenException("Access Denide")

    const tokens = await this.getTokens(user.id, user.email)
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token)
    res.cookie("refresh_token", tokens.refresh_token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    })
    return tokens
  }



  async logout(userId: number): Promise<boolean> {
    const user = await this.prismaService.user.updateMany({
        where: {
            id: +userId,
            hashedRefreshToken: {
                not: null
            }
        },
        data: {
            hashedRefreshToken: null,
        }
    })
    console.log(user);
    if(!user) throw new ForbiddenException('Access denide')
    return true
  }

  async refreshTokens(userId: number, refreshToken: string, res: Response): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
        where: {
            id: +userId
        }
    })
    if(!user || !user.hashedRefreshToken){
        throw new ForbiddenException("Access denide")
    }


    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken)
    if(!rtMatches) throw new ForbiddenException("Access Denide")

    const tokens = await this.getTokens(user.id, user.email)
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token)
    res.cookie("refresh_token", tokens.refresh_token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    })
    return tokens
  }

 



  async updateRefreshTokenHash(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 7)
    await this.prismaService.user.update({
        where: {
            id: userId
        },
        data: {
            hashedRefreshToken: hashedRefreshToken
        }
    })
  }








  async getTokens(userId: number, email: string): Promise<Tokens> {
      const jwtPayload: JwtPayload = {
          sub: userId,
          email: email,
      }
      const [accessToken, refreshToken] = await Promise.all([
          this.jwtService.signAsync(jwtPayload, {
              secret: process.env.ACCESS_TOKEN_KEY,
              expiresIn: process.env.ACCESS_TOKEN_TIME,
          }),
          this.jwtService.signAsync(jwtPayload, {
              secret: process.env.REFRESH_TOKEN_KEY,
              expiresIn: process.env.REFRESH_TOKEN_TIME,
          })
      ])
      return {
          access_token: accessToken,
          refresh_token: refreshToken
      }
  }
}
