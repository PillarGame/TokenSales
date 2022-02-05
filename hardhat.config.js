require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
require('hardhat-deploy');
require('hardhat-abi-exporter');
const fs = require("fs");

const {OPTIMISTIC_KOVAN_PRIVATE_KEY, ALCHEMY_API_KEY} = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },
    networks: {
        kovanoptimism: {
            url: `https://opt-kovan.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
            accounts: [`${OPTIMISTIC_KOVAN_PRIVATE_KEY}`]
        },
        hecochaintest: {
            url: 'https://http-mainnet.hecochain.com',
            accounts: [],
            chainId: 256,
            live: true,
            saveDeployments: true,
            tags: ["staging"],
            gasMultiplier: 2
        },
        hecochain: {
            url: 'https://http-testnet.hecochain.com',
            accounts: [],
            chainId: 128,
            live: true,
            saveDeployments: true
        },
        avalanche: {
            url: "https://api.avax.network/ext/bc/C/rpc",
            accounts: [],
            chainId: 43114,
            live: true,
            saveDeployments: true,
            gasPrice: 470000000000
        },
        fantom: {
            url: "https://rpcapi.fantom.network",
            accounts: [],
            chainId: 250,
            live: true,
            saveDeployments: true,
            gasPrice: 22000000000
        },
        fantomtestnet: {
            url: "https://rpc.testnet.fantom.network",
            accounts: [],
            chainId: 4002,
            live: true,
            saveDeployments: true,
            tags: ["staging"],
            gasMultiplier: 2
        },
        matic: {
            url: "https://rpc-mainnet.maticvigil.com",
            accounts: [],
            chainId: 137,
            live: true,
            saveDeployments: true
        },
    },
    abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [''],
    spacing: 2,
    pretty: true,
  }
};


function getSortedFiles(dependenciesGraph) {
  const tsort = require("tsort")
  const graph = tsort()

  const filesMap = {}
  const resolvedFiles = dependenciesGraph.getResolvedFiles()
  resolvedFiles.forEach((f) => (filesMap[f.sourceName] = f))

  for (const [from, deps] of dependenciesGraph.entries()) {
    for (const to of deps) {
      graph.add(to.sourceName, from.sourceName)
    }
  }

  const topologicalSortedNames = graph.sort()

  // If an entry has no dependency it won't be included in the graph, so we
  // add them and then dedup the array
  const withEntries = topologicalSortedNames.concat(resolvedFiles.map((f) => f.sourceName))

  const sortedNames = [...new Set(withEntries)]
  return sortedNames.map((n) => filesMap[n])
}

function getFileWithoutImports(resolvedFile) {
  const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm

  return resolvedFile.content.rawContent.replace(IMPORT_SOLIDITY_REGEX, "").trim()
}

subtask("flat:get-flattened-sources", "Returns all contracts and their dependencies flattened")
    .addOptionalParam("files", undefined, undefined, types.any)
    .addOptionalParam("output", undefined, undefined, types.string)
    .setAction(async ({ files, output }, { run }) => {
      const dependencyGraph = await run("flat:get-dependency-graph", { files })
      console.log(dependencyGraph)

      let flattened = ""

      if (dependencyGraph.getResolvedFiles().length === 0) {
        return flattened
      }

      const sortedFiles = getSortedFiles(dependencyGraph)

      let isFirst = true
      for (const file of sortedFiles) {
        if (!isFirst) {
          flattened += "\n"
        }
        flattened += `// File ${file.getVersionedName()}\n`
        flattened += `${getFileWithoutImports(file)}\n`

        isFirst = false
      }

      // Remove every line started with "// SPDX-License-Identifier:"
      flattened = flattened.replace(/SPDX-License-Identifier:/gm, "License-Identifier:")

      flattened = `// SPDX-License-Identifier: MIXED\n\n${flattened}`

      // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
      flattened = flattened.replace(/pragma experimental ABIEncoderV2;\n/gm, ((i) => (m) => (!i++ ? m : ""))(0))
      // Remove every line started with "pragma abicoder v2;" except the first one
      flattened = flattened.replace(/pragma abicoder v2;\n/gm, ((i) => (m) => (!i++ ? m : ""))(0))
      // Remove every line started with "pragma solidity ****" except the first one
      flattened = flattened.replace(/pragma solidity .*$\n/gm, ((i) => (m) => (!i++ ? m : ""))(0))


      flattened = flattened.trim()
      if (output) {
        console.log("Writing to", output)
        fs.writeFileSync(output, flattened)
        return ""
      }
      return flattened
    })

subtask("flat:get-dependency-graph")
    .addOptionalParam("files", undefined, undefined, types.any)
    .setAction(async ({ files }, { run }) => {
      const sourcePaths = files === undefined ? await run("compile:solidity:get-source-paths") : files.map((f) => fs.realpathSync(f))

      const sourceNames = await run("compile:solidity:get-source-names", {
        sourcePaths,
      })

      const dependencyGraph = await run("compile:solidity:get-dependency-graph", { sourceNames })

      return dependencyGraph
    })

task("flat", "Flattens and prints contracts and their dependencies")
    .addOptionalVariadicPositionalParam("files", "The files to flattener", undefined, types.inputFile)
    .addOptionalParam("output", "Specify the output file", undefined, types.string)
    .setAction(async ({ files, output }, { run }) => {
      console.log(
          await run("flat:get-flattened-sources", {
            files,
            output,
          })
      )
    })
