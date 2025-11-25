import createSBaGenModule from "./wasm/sbagen.mjs";

export default async function (sbg) {
  const module = await createSBaGenModule({
    print: (text) => console.log(text),
    printErr: (text) => console.error(text),
  });

  if (sbg) {
    module.FS.writeFile("brainbeater.sbg", sbg);
  }

  return {
    addFile(name, bytes) {
      module.FS.writeFile(name, bytes);
    },

    play(duration) {
      module._signal_handler(0);

      // Play the SBG file
      const args = ["-S"]; // Start immediately

      if (duration) {
        // Convert duration in seconds to MM:SS format
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        args.push("-L", `${minutes}:${seconds.toString().padStart(2, "0")}`);
      }

      if (sbg) {
        args.push("brainbeater.sbg");
      }

      module.callMain(args);
    },

    run(args) {
      module._signal_handler(0);
      module.callMain(args);
    },

    stop() {
      // Send signal to stop playback
      module._signal_handler(2);
    },
  };
}
