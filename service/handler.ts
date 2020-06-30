import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { run } from "./pptr";

export const analyze: APIGatewayProxyHandler = async (event, _context) => {
  const url = event?.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "please provide url in queryStringParameter",
          input: event,
        },
        null,
        2
      ),
    };
  }
  const img = await run(url).catch(() => undefined);
  if (!img) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "failed to process request",
        },
        null,
        2
      ),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        img,
      },
      null,
      2
    ),
  };
};
