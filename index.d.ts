declare class Console {
  static reset: string;
  static bright: string;
  static dim: string;
  static underscore: string;
  static blink: string;
  static reverse: string;
  static black: string;
  static red: string;
  static green: string;
  static yellow: string;
  static blue: string;
  static magenta: string;
  static cyan: string;
  static white: string;
  Console: Console;

  constructor(
    id: string,
    options?: {
      date?: boolean;
      trace?: boolean;
      debug?: boolean;
      index?: number;
    },
  );
  announce(...data: any[]): void;
  assert(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(key?: string): void;
  countReset(key?: string): void;
  println(): void;
  print(...data: any[]): void;
  debug(...data: any[]): void;
  dir(item?: any, format?: any): void;
  dirxml(...data: any[]): void;
  error(...data: any[]): void;
  group(label?: string, ...data: any[]): void;
  groupCollapsed(label?: string): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  success(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(key: string): void;
  timeLog(key: string, ...data: any[]): void;
  timeEnd(key: string, print?: boolean): void;
  timeStamp(key: string): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
  profile(key: string, ...data: any[]): void;
  profileEnd(key: string, print?: boolean): void;
}

export default Console;
export { Console };
