pragma solidity ^0.4.24;

/**
* @title Ownable
* @dev The Ownable contract has an owner address, and provides basic authorization control
* functions, this simplifies the implementation of "user permissions".
*/
contract Ownable {
	address public owner;

	event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
    * @dev The Ownable constructor sets the original `owner` of the contract to the sender
    * account.
    */
    constructor () public {
    	owner = msg.sender;
    }

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
    	require(msg.sender == owner, "Only contract owner can call this function");
    	_;
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function transferOwnership(address newOwner) public onlyOwner {
    	require(newOwner != address(0));
    	emit OwnershipTransferred(owner, newOwner);
    	owner = newOwner;
    }

}

contract Approval is Ownable{
	bytes20[] public allNodes;
	bool[] public hasApproval;
	mapping (bytes20 => bool) public nodeApproved;
	mapping (address => bool) public identityApproved;

	event NodeApproved(bytes20 nodeId);
	event NodeRemoved(bytes20 nodeId);

	function identityHasApproval(address identity)
	public view returns(bool) {
		if(allNodes.length == 0) return true;
		return identityApproved[identity];
	}

	function nodeHasApproval(bytes20 nodeId)
	public view returns(bool) {
		return nodeApproved[nodeId];
	}

	function getAllNodes() public view returns(bytes20[]){
		return allNodes;
	}

	function getNodeStatuses() public view returns(bool[]){
		return hasApproval;
	}

	function approve(address identity, bytes20 nodeId, uint256 nodeIndex) 
	public onlyOwner {
		if(identity != address(0)) identityApproved[identity] = true;

		if(nodeId != bytes20(0)) {
			if(nodeIndex < allNodes.length && allNodes[nodeIndex] == nodeId && !hasApproval[nodeIndex]) {
				hasApproval[nodeIndex] = true;
			}
			else {
				allNodes.push(nodeId);
				hasApproval.push(true);
				nodeApproved[nodeId] = true;
				emit NodeApproved(nodeId);
			}
		}
	}

	function removeApproval(address identity, bytes20 nodeId, uint256 nodeIndex) 
	public onlyOwner {
		if(identity != address(0) && identityApproved[identity]){
			identityApproved[identity] = false;
		}
		if(nodeId != bytes20(0) && nodeApproved[nodeId]){
			if(allNodes[nodeIndex] == nodeId && hasApproval[nodeIndex]) {
				hasApproval[nodeIndex] = false;
				nodeApproved[nodeId] = false;
				emit NodeRemoved(nodeId);
			}
		}
	}

	function setIdentityApproval(address identity, bool newApproval) 
	public onlyOwner {
		if(identity != address(0) && newApproval != identityApproved[identity])
		identityApproved[identity] = newApproval;
	}
}
contract MultiApproval is Ownable{

	Approval approvalContract;

	constructor(address approvalAddress) public onlyOwner {
		approvalContract = Approval(approvalAddress);
	}


	function changeApprovalOwner(address newOwner) public onlyOwner {
		require(newOwner != address(0));
		approvalContract.transferOwnership(newOwner);

	}

	event ApproveManyERC(uint i);
	event ApproveManyBoth(uint i);
	event DisapproveManyERC(uint i);
	event DisapproveManyBoth(uint i);
	event DisapproveThenApprove(uint i);
	function approveManyERC725(address [] identities) public onlyOwner {
		for (uint i = 0; i < identities.length; i++) {
			approvalContract.setIdentityApproval(identities[i],true);
		}
		emit ApproveManyERC(i);
	}

	function disapproveManyERC725(address [] identities) public onlyOwner {
		for (uint i = 0; i < identities.length; i++) {
			approvalContract.setIdentityApproval(identities[i],false);
		}
		emit DisapproveManyERC(i);
	}

	function approveManyNodeIDs(address [] identities, bytes20 [] nodeIds, uint256 [] nodeIndexes) public onlyOwner {
		for (uint i = 0; i < identities.length; i++) {
			approvalContract.approve(identities[i],nodeIds[i],nodeIndexes[i]); 
		}
		emit ApproveManyBoth(i);
	}

	function disapproveManyNodeIDs(address [] identities, bytes20 [] nodeIds, uint256 [] nodeIndexes) public onlyOwner {
		for (uint i = 0; i < identities.length; i++) {
			approvalContract.removeApproval(identities[i],nodeIds[i],nodeIndexes[i]);
		}
		emit DisapproveManyBoth(i);
	}
	
	
	function transferApprovals(address [] oldIdentities, address [] newIdentities, bytes20 [] nodeIds, uint256 [] nodeIndexes) public onlyOwner {
		require(oldIdentities.length == newIdentities.length);
		for (uint i = 0; i < oldIdentities.length; i++) {
			approvalContract.removeApproval(oldIdentities[i],nodeIds[i],nodeIndexes[i]);
			approvalContract.approve(newIdentities[i],nodeIds[i],nodeIndexes[i]);
		}
		emit DisapproveThenApprove(i);
	}
	
}