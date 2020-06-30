import { NextApiHandler } from "next";
import { run } from "../../service/pptr";

const handler: NextApiHandler = async (req, res) => {
  const img = await run(req.query.url as string);
  res.status(200).json({ url: img });
};

export default handler;
