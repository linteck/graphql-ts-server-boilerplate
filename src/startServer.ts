import "reflect-metadata";
import "dotenv/config";
import * as Express from 'express';
import * as BodyParser from "body-parser";
var cors = require('cors')
const Logger = require('morgan');
const CookieSession = require('cookie-session');
const CookieParser = require('cookie-parser');

import { ApolloServer } from 'apollo-server-express';

// const {UserAPI, GetUser} = require('./datasources/user');
// const UDAPI = require('./datasources/udapi');

const internalEngineDemo = require('./utils/engine-demo');

// import * as session from "express-session";
// import * as connectRedis from "connect-redis";
// import * as RateLimit from "express-rate-limit";
// import * as RateLimitRedisStore from "rate-limit-redis";

//import { redis } from "./redis";
import { createTypeormConn } from "./utils/createTypeormConn";
import { confirmEmail } from "./routes/confirmEmail";
import { genSchema } from "./utils/genSchema";
// import { redisSessionPrefix } from "./constants";
import { createTestConn } from "./testUtils/createTestConn";

// const SESSION_SECRET = "ajslkjalksjdfkl";
// const RedisStore = connectRedis(session as any);

// creates a sequelize connection once. NOT for every request

// const udapiStore = {
//   user:'ubnt',
//   password:'ubnt',
//   deviceIP: '192.168.111.212',
//   devicePort: '8080',
//   udapiProtocol:'http',
//   basePath:'api/v1.0'
// };
// set up any dataSources our resolvers need
const dataSources = () => ({
  // launchAPI: new LaunchAPI(),
  // userAPI: new UserAPI(),
  // udAPI: new UDAPI({udapiStore}),
});

interface ContextParams {
  request:any,
  connection:any
}
// the function that sets up the global context for each resolver, using the req
const context = async ({request, connection}:ContextParams) => {
  if (connection) {
    return connection.context;
  }


  // simple auth check on every request
  //console.dir(req.headers)
  // console.log("V:" + auth)
  // let eauth = Buffer.from(auth).toString('base64')
  // console.log("E:" + eauth)
  // {
  // "authorization":"YUBiLmNvbQ=="
  // }


//Sample usage
  // const auth = req.cookies['token'] || ""
  // console.log(auth)
  // const email = Buffer.from(auth, 'base64').toString('ascii');
  //
  // let user = await GetUser({email})
  // // if the email isn't formatted validly, return null for user
  // if (!user) {
  //   console.warn(`Get user fail.`);
  //   return { user: null };
  // }
  // return { user: { ...user.dataValues, loggedIn: true}  };
  return {
    url: request.protocol + "://" + request.get("host"),
    session: request.session,
    req: request
  }
};
const corsOptions = {
  credentials: true,
  origin:
    process.env.NODE_ENV === "test"
      ? "*"
      : (process.env.FRONTEND_HOST as string)
};
// Set up Apollo Server
const server = new ApolloServer({
  schema: genSchema(),
  dataSources,
  context,
  engine: {
    apiKey: process.env.ENGINE_API_KEY,
    ...internalEngineDemo,
  },
  tracing: true,
  formatResponse: (response:any, requestContext:any) => {
    if (requestContext.response && requestContext.response.http) {
      requestContext.response.http.headers.set('Set-Cookie', 'token=YUBiLmNvbQ==');
    }
    return response;
  },
  introspection:true,
  playground: {
    settings: {
      "request.credentials": "include",
    },
  },
});

// Start our server if we're not in a test env.
// if we're in a test env, we'll manually start it in a test
if (process.env.NODE_ENV !== 'test') {

}

export const startServer = async () => {
  if (process.env.NODE_ENV === "test") {
    //await redis.flushall();
  }


  // server.express.use(
  //   new RateLimit({
  //     store: new RateLimitRedisStore({
  //       client: redis
  //     }),
  //     windowMs: 15 * 60 * 1000, // 15 minutes
  //     max: 100, // limit each IP to 100 requests per windowMs
  //     delayMs: 0 // disable delaying - full speed until the max limit is reached
  //   })
  // );
  //
  // server.express.use(
  //   session({
  //     store: new RedisStore({
  //       client: redis as any,
  //       prefix: redisSessionPrefix
  //     }),
  //     name: "qid",
  //     secret: SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === "production",
  //       maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  //     }
  //   } as any)
  // );




  if (process.env.NODE_ENV === "test") {
    await createTestConn(true);
  } else {
    await createTypeormConn();
  }

  const app = Express();
  // Additional middleware can be mounted at this point to run before Apollo.
  //app.use('*', jwtCheck, requireAuth, checkScope);

  app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
  app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 4000);
  // parses json data sent to us by the user
  app.use(CookieSession({
    name: 'session',
    keys: ['token'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }))
  app.use(CookieParser())
  app.use(Logger('dev'));
  app.use(BodyParser.json());       // to support JSON-encoded bodies
  app.use(BodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));
  app.use(cors(corsOptions));
  app.get("/confirm/:id", confirmEmail);

  // app is from an existing express app. Mount Apollo middleware here. If no path is specified, it defaults to `/graphql`.
  server.applyMiddleware({ app, path: '/' });
  app.listen(app.get('port'), () => {
    console.log(' 🚀 App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
    console.log('    Press CTRL-C to stop\n');
  });

  return app;
};
