const { chatWithAI } = require('../services/gemini.service');
const sendResponse = require('../utils/response');

async function chat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendResponse(res, { code: 400, success: false, message: 'message wajib diisi' });
    }

    const result = await chatWithAI(message, Array.isArray(history) ? history : []);

    return sendResponse(res, {
      message: 'Berhasil dapat balasan',
      data: result, // { reply, orderCreated }
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    return sendResponse(res, { code: 500, success: false, message: 'Gagal menghubungi AI, coba lagi' });
  }
}

module.exports = { chat };
