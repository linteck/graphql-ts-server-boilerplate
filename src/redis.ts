//import * as Redis from "ioredis";

class Redis {
  cache:any;
  constructor() {
    this.cache = {}
  }
  get(key:string):any {
    return this.cache[key];
  }
  del(key:string):any {
    delete this.cache[key]
  }
  set(key:string, value:any) {
    this.cache[key] = value
  }
}

export const redis = new Redis();
