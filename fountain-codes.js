function getRandom(max = 1) {
  return Math.floor((Math.random() * max));
}

function Encoder(data) {
  this.data = data;
  this.dataLength = data.length;

  this.makePacket = () => {
    let result = 0;
    const slices = [];
    const numSlices = getRandom(3) + 1;

    while (slices.length < numSlices) {
      const randomSliceNumber = getRandom(this.dataLength);
      if (slices.indexOf(randomSliceNumber) === -1) {
        slices.push(randomSliceNumber);
        // XOR slice with previous slice(s)
        result ^= data[randomSliceNumber].charCodeAt(0);
      }
    }

    return {
      result,
      slices,
      totalSlices: this.dataLength,
    };
  }
}

function Decoder() {
  this.decoded = [];
  this.queue = [];
  this.length = 0;

  this.decode = packet => {
    // Temporary
    if (!this.length) {
      this.length = packet.totalSlices;
    }

    // 1. For each source block from the list, if we have already decoded it,
    //    xor that block with the encoded block, and remove it from the list of source blocks.
    packet.slices = packet.slices.filter(sliceNumber => {
      if (this.decoded[sliceNumber]) {
        packet.result ^= this.decoded[sliceNumber];
        return false;
      }
      return true;
    });

    // 2. If there are at least two source blocks left in the list, add the encoded block to a holding area.
    if (packet.slices.length > 1) {
      this.queue.push(packet);
      // This is a problem because it can give you duplicate packets in the queue
    }

    // 3. If there is only one source block remaining in the list, we have successfully
    //    decoded another source block! Add it to the decoded file and iterate through the
    //    holding list, repeating the procedure for any encoded blocks that contain it.
    else if (packet.slices.length === 1) {
      const decodedSliceNumber = packet.slices[0];
      this.decoded[decodedSliceNumber] = packet.result;
      // this is terrible
      this.queue = this.queue.filter(queuedPacket => {
        if (queuedPacket.slices.indexOf(decodedSliceNumber) > -1) {
          queuedPacket.slices = queuedPacket.slices.filter(sliceNumber => sliceNumber !== decodedSliceNumber);
          queuedPacket.result ^= packet.result;
          if (queuedPacket.slices.length === 1) {
            this.decoded[queuedPacket.slices[0]] = queuedPacket.result;
            return false;
          }
        }
        return true;
      })
    }

    return this.isComplete() && this.decoded;
  };

  this.processQueue = () => {

  };

  this.isComplete = () => {
    return this.decoded.length > 0
      // this is terrible
      && this.decoded.filter(item => item).length === this.length;
  };
}

function run(data = '0123456789ABCDEFGHIJ') {
  const encoder = new Encoder(data);
  const decoder = new Decoder();

  let i = 0;
  while (!decoder.decode(encoder.makePacket())) {
    i++;
  }
  console.log(`Message of length ${decoder.length} decoded in ${i} packets`);
  console.log(decoder.decoded);
  console.log(`Decoded message: "${String.fromCharCode(...(decoder.decoded))}"`);
}

run('Hello there, my friend Bob. How are you?');
