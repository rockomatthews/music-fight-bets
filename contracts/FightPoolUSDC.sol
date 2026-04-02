// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal USDC parimutuel fight pool scaffold.
/// Design goals:
/// - Non-custodial claims (users claim their payout)
/// - Deterministic accounting
/// - Winner chosen by verifiable randomness in production (VRF).
///
/// THIS IS A SCAFFOLD.
/// - VRF integration, access control, and security hardening still required.
/// - Do not deploy to mainnet without audits.

interface IERC20 {
  function transferFrom(address from, address to, uint256 amount) external returns (bool);
  function transfer(address to, uint256 amount) external returns (bool);
}

contract FightPoolUSDC {
  IERC20 public immutable usdc;
  address public owner;
  uint256 public feeBps; // e.g. 200 = 2%

  enum Side {
    A,
    B
  }

  enum Status {
    Open,
    Closed,
    Resolved
  }

  struct MatchInfo {
    bytes32 fighterA; // offchain id hash
    bytes32 fighterB;
    uint64 closeTime;
    Status status;
    Side winner;
    uint256 totalA;
    uint256 totalB;
    uint256 feeTaken;
  }

  // matchId => MatchInfo
  mapping(uint256 => MatchInfo) public matches;
  uint256 public matchCount;

  // matchId => side => user => amount
  mapping(uint256 => mapping(Side => mapping(address => uint256))) public bets;

  // matchId => user => claimed
  mapping(uint256 => mapping(address => bool)) public claimed;

  event MatchCreated(uint256 indexed matchId, bytes32 fighterA, bytes32 fighterB, uint64 closeTime);
  event BetPlaced(uint256 indexed matchId, address indexed user, Side side, uint256 amount);
  event MatchClosed(uint256 indexed matchId);
  event MatchResolved(uint256 indexed matchId, Side winner, uint256 feeTaken);
  event Claimed(uint256 indexed matchId, address indexed user, uint256 payout);

  modifier onlyOwner() {
    require(msg.sender == owner, "not_owner");
    _;
  }

  constructor(address usdcAddress, uint256 feeBps_) {
    require(usdcAddress != address(0), "bad_usdc");
    require(feeBps_ <= 1000, "fee_too_high"); // <=10%
    usdc = IERC20(usdcAddress);
    owner = msg.sender;
    feeBps = feeBps_;
  }

  function setFeeBps(uint256 feeBps_) external onlyOwner {
    require(feeBps_ <= 1000, "fee_too_high");
    feeBps = feeBps_;
  }

  function transferOwnership(address next) external onlyOwner {
    require(next != address(0), "bad_owner");
    owner = next;
  }

  function createMatch(bytes32 fighterA, bytes32 fighterB, uint64 closeTime) external onlyOwner returns (uint256 matchId) {
    require(closeTime > block.timestamp, "close_in_past");

    matchId = ++matchCount;
    matches[matchId] = MatchInfo({
      fighterA: fighterA,
      fighterB: fighterB,
      closeTime: closeTime,
      status: Status.Open,
      winner: Side.A,
      totalA: 0,
      totalB: 0,
      feeTaken: 0
    });

    emit MatchCreated(matchId, fighterA, fighterB, closeTime);
  }

  function placeBet(uint256 matchId, Side side, uint256 amount) external {
    MatchInfo storage m = matches[matchId];
    require(m.status == Status.Open, "not_open");
    require(block.timestamp < m.closeTime, "closed");
    require(amount > 0, "bad_amount");

    require(usdc.transferFrom(msg.sender, address(this), amount), "transfer_failed");

    bets[matchId][side][msg.sender] += amount;
    if (side == Side.A) m.totalA += amount;
    else m.totalB += amount;

    emit BetPlaced(matchId, msg.sender, side, amount);
  }

  function closeMatch(uint256 matchId) external onlyOwner {
    MatchInfo storage m = matches[matchId];
    require(m.status == Status.Open, "bad_status");
    require(block.timestamp >= m.closeTime, "too_early");
    m.status = Status.Closed;
    emit MatchClosed(matchId);
  }

  /// @notice Resolve match. In production, winner should be set from verifiable randomness.
  function resolveMatch(uint256 matchId, Side winner) external onlyOwner {
    MatchInfo storage m = matches[matchId];
    require(m.status == Status.Closed, "bad_status");

    m.status = Status.Resolved;
    m.winner = winner;

    // Take fee from total pool
    uint256 pool = m.totalA + m.totalB;
    uint256 fee = (pool * feeBps) / 10_000;
    m.feeTaken = fee;

    emit MatchResolved(matchId, winner, fee);
  }

  function claim(uint256 matchId) external {
    MatchInfo storage m = matches[matchId];
    require(m.status == Status.Resolved, "not_resolved");
    require(!claimed[matchId][msg.sender], "already_claimed");

    uint256 userWin = bets[matchId][m.winner][msg.sender];
    require(userWin > 0, "no_winning_bet");

    uint256 winTotal = (m.winner == Side.A) ? m.totalA : m.totalB;
    uint256 poolAfterFee = (m.totalA + m.totalB) - m.feeTaken;

    // payout = userWin / winTotal * poolAfterFee
    uint256 payout = (userWin * poolAfterFee) / winTotal;

    claimed[matchId][msg.sender] = true;
    require(usdc.transfer(msg.sender, payout), "payout_failed");

    emit Claimed(matchId, msg.sender, payout);
  }
}
