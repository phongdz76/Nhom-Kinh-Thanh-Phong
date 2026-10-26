export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function boundedBody(
  request: Request,
  limit: number,
  timeout = 10000,
) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit))
    throw new HttpError(413, "Dữ liệu gửi lên quá lớn.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Thiếu nội dung yêu cầu.");
  let rejectRead: (error: HttpError) => void = () => {};
  const stopped = new Promise<never>((_resolve, reject) => {
    rejectRead = reject;
  });
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  const abort = () => {
    rejectRead(
      new HttpError(408, "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại."),
    );
    cancel();
  };
  // Total deadline, not a timer reset by each byte from a slow sender.
  const timer = setTimeout(abort, timeout);
  request.signal.addEventListener("abort", abort, { once: true });
  const chunks: Buffer[] = [];
  let block: Buffer | undefined;
  let used = 0;
  let length = 0;
  let finished = false;
  const deadline = performance.now() + timeout;
  try {
    if (request.signal.aborted) throw new HttpError(408, "Yêu cầu đã bị hủy.");
    const read = async () => {
      while (true) {
        if (performance.now() >= deadline)
          throw new HttpError(408, "Yêu cầu đã hết thời gian chờ.");
        const { done, value } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        length += value.byteLength;
        if (length > limit)
          throw new HttpError(413, "Dữ liệu gửi lên quá lớn.");
        // Pack tiny incoming chunks into bounded blocks instead of retaining one
        // object (or one timeout-promise listener) per attacker-selected chunk.
        let offset = 0;
        while (offset < value.byteLength) {
          if (!block || used === block.length) {
            if (block) chunks.push(block);
            block = Buffer.allocUnsafe(Math.min(65536, limit));
            used = 0;
          }
          const size = Math.min(block.length - used, value.byteLength - offset);
          block.set(value.subarray(offset, offset + size), used);
          used += size;
          offset += size;
        }
      }
      if (block && used) chunks.push(block.subarray(0, used));
      return Buffer.concat(chunks, length);
    };
    return await Promise.race([read(), stopped]);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", abort);
    if (!finished) cancel();
    reader.releaseLock();
  }
}
