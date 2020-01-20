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
  lpush(key:string, value:any) {
    if (!this.cache[key]) {
      this.cache[key] = [value,];
    } else if (Array.isArray(this.cache[key])) {
      this.cache[key].push(value);
    } else {
      throw Error(`Key ${key} is not a List!`);
    }
  }
}

export const redis = new Redis();
