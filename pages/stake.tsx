import {
  ThirdwebNftMedia,
  useAddress,
  useMetamask,
  useNFTDrop,
  useToken,
  useTokenBalance,
  useOwnedNFTs,
  useContract,
} from "@thirdweb-dev/react";
import { BigNumber, ethers } from "ethers";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

const nftDropContractAddress = "0x10BF620547bF5Bb8cAbc62431D0C39C1DB4f4b45";
const tokenContractAddress = "0xe63c1b8C952C09b9644Cd2EdE85149b9CE9c7315";
const stakingContractAddress = "0xEF6F25E14B82b94A835264753E3EF36697d7D3b7";
const Stake: NextPage = () => {
  // Wallet Connection Hooks
  const address = useAddress();
  const connectWithMetamask = useMetamask();

  // Contract Hooks
  const nftDropContract = useContract(nftDropContractAddress, "nft-drop").contract;
  const tokenContract = useContract(tokenContractAddress, "token").contract;
  const { contract, isLoading } = useContract(stakingContractAddress);

  // Load Unstaked NFTs
  const { data: ownedNfts } = useOwnedNFTs(nftDropContract, address);

  // Load Balance of Token
  const { data: tokenBalance } = useTokenBalance(tokenContract, address);

  ///////////////////////////////////////////////////////////////////////////
  // Custom contract functions
  ///////////////////////////////////////////////////////////////////////////
  const [stakedNfts, setStakedNfts] = useState<any[]>([]);
  const [claimableRewards, setClaimableRewards] = useState<BigNumber>();

  useEffect(() => {
    if (!contract) return;

    async function loadStakedNfts() {
      const stakedTokens = await contract?.call("getStakedTokens", address);

      // For each staked token, fetch it from the sdk
      const stakedNfts = await Promise.all(
        stakedTokens?.map(
          async (stakedToken: { staker: string; tokenId: BigNumber }) => {
            const nft = await nftDropContract?.get(stakedToken.tokenId);
            return nft;
          }
        )
      );

      setStakedNfts(stakedNfts);
      console.log("setStakedNfts", stakedNfts);
    }

    if (address) {
      loadStakedNfts();
    }
  }, [address, contract, nftDropContract]);

  useEffect(() => {
    if (!contract || !address) return;

    async function loadClaimableRewards() {
      const cr = await contract?.call("availableRewards", address);
      console.log("Loaded claimable rewards", cr);
      setClaimableRewards(cr);
    }

    loadClaimableRewards();
  }, [address, contract]);

  ///////////////////////////////////////////////////////////////////////////
  // Write Functions
  ///////////////////////////////////////////////////////////////////////////
	async function stakeNft(id: string) {
    if (!address) return;

    const isApproved = await nftDropContract?.isApproved(
      address,
      stakingContractAddress
    );
    // If not approved, request approval
    if (!isApproved) {
      await nftDropContract?.setApprovalForAll(stakingContractAddress, true);
    }
    const stake = await contract?.call("stake", id);
  }


  async function withdraw(id: BigNumber) {
    const withdraw = await contract?.call("withdraw", id);
  }

  async function claimRewards() {
    const claim = await contract?.call("claimRewards");
  }

  if (isLoading) {
    return <div>Loading</div>;
  }
	return (
    <div className="wrapper">
      <h1 className={styles.h1}>Stake Your NFTs</h1>

      <hr className="" />

      {!address ? (
        <button className="btn" onClick={connectWithMetamask}>
          Connect Wallet
        </button>
      ) : (
        <>
          <h2>Your Tokens</h2>

          <div >
            <div >
              <h3 className="h3 Claimable">Claimable Rewards</h3>
              <p className="Claimable" >
                <b>
                  {!claimableRewards
                    ? "Loading..."
                    : ethers.utils.formatUnits(claimableRewards, 18)}
                </b>{" "}
                {tokenBalance?.symbol}
              </p>
            </div>
            <div className={styles.tokenItem}>
              <h3 className="current">Current Balance</h3>
              <p className="rewards">
                <b>{tokenBalance?.displayValue}</b> {tokenBalance?.symbol}
              </p>
            </div>
          </div>

          <button
            className="btn"
            onClick={() => claimRewards()}
          >
            Claim Rewards
          </button>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />

          <h2>Your Staked NFTs</h2>
          <div className={styles.nftBoxGrid}>
            {stakedNfts?.map( (nft) => (
              <div className={styles.nftBox} key={nft?.metadata.id.toString()}>
                <div className="cnf">
								<ThirdwebNftMedia
                   metadata={nft?.metadata}
                  className={styles.nftMedia}
                />
                <h3>{nft?.metadata.name}</h3>
                <button
                  className="btn cn"
                  onClick={() => withdraw(nft?.metadata.id)}
                >
                  Withdraw
                </button>
              </div>
							</div>
            ))}
          </div>

          <hr className={`${styles.divider} ${styles.spacerTop}`} />

          <h2>Your Unstaked NFTs</h2>

          <div className={styles.nftBoxGrid}>
            {ownedNfts?.map((nft) => (
              <div className={styles.nftBox} key={nft?.metadata.id.toString()}>
								<div className="cnf">
                <ThirdwebNftMedia
                  metadata={nft?.metadata}
                  className={styles.nftMedia}
                />
                <h3>{nft?.metadata.name}</h3>
                <button
                  className="btn cn"
                  onClick={() => stakeNft(BigInt(nft?.metadata.id))}
                >
                  Stake
                </button>
              </div>
							</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Stake;