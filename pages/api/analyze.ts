import { NextApiHandler } from "next";
// import { run } from "../../service/pptr";

const handler: NextApiHandler = async (req, res) => {
  //  const img =  run(req.query.url as string);
  res.status(200).json({ url: "" });
};

export default handler;
