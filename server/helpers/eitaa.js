const https = require("https");

const sendEitaaMessage = async (chatId, text) => {
  const token = process.env.EITAA_TOKEN;
  if (!token || !chatId || !text) {
    return null;
  }

  const payload = JSON.stringify({
    token,
    chat_id: chatId,
    text,
  });

  const options = {
    hostname: "eitaayar.ir",
    port: 443,
    path: "/api/app/sendMessage",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseBody);
            return resolve(parsed);
          } catch (error) {
            return resolve({ statusCode: res.statusCode, raw: responseBody });
          }
        }

        const error = new Error(
          `Eitaa API responded with ${res.statusCode}`
        );
        error.statusCode = res.statusCode;
        error.body = responseBody;
        reject(error);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = { sendEitaaMessage };
