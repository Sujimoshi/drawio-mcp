import { appendFileSync } from 'fs';
import { resolve } from 'path';

export class Logger {
  static main = new Logger('main');

  constructor(public name: string) {}

  log(level: 'info' | 'error', message: string, data: any = {}) {
    const lvl = level === 'info' ? '🟢' : '🔴';
    const log = `[${new Date().toISOString()}] ${lvl} ${this.name} - ${message} ${JSON.stringify(data, null, 2)}`;
    appendFileSync(resolve(__dirname, `../logs/${this.name}.log`), `${log}\n`);
  }
 
  info(message: string, data: any = {}) {
    this.log('info', message, data);
  }

  error(message: string, data: any = {}) {
    this.log('error', message, data);
  }
}