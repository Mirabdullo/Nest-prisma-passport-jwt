import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'

async function start() {
  try {
    const PORT = process.env.PORT
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser())
    await app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishga tushdi`);
    });
  } catch (error) {
    console.log(error);
  }
}
start();
