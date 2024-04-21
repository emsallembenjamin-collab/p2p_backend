db.getCollection("positions").aggregate([
	{
		$lookup: {
			from: "symbols",
			foreignField: "symbol",
			localField: "instrument",
			as: "symbol"
		}
	},
	{
		$unwind: "$symbol"
	},
	{
		$project: {
			volume: { $abs: { $toDecimal: "$volumeFrom" } },
			"symbol.decimalPlaces": 1,
			amount: { $toDecimal: "$amount" },
			date: { $toDate: "$generatedTime" },
			decMass: { $pow: [10, { $toDecimal: "$symbol.decimalPlaces" }] },
			"clientId": 1, 
			"instrument": 1
		}
	},
	{
		$facet: {
			dateAnalytics: [
				{
					$group: {
						_id:  { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
						profit: {
							$sum: {
								$cond: {
									if: { $gte: ["$amount", 0] },
									then: { $divide: ["$amount", "$decMass"] },
									else: 0
								}
							}
						},
						volume: { $sum: { $divide: ["$volume", "$decMass"] } },
					},
				}
			],
			profit: [
				{
					$group: {
						_id: "$clientId", 
						profit: {
							$sum: {
								$cond: {
									if: { $gte: ["$amount", 0] },
									then: { $divide: ["$amount", "$decMass"] },
									else: 0
								}
							}
						}
					}
				},
				{
					$match: {
						profit: {
							$gt: 0
						}
					}
				},
				{
					$sort: {
						profit: -1
					}
				},
				{
					$limit: 7
				}
			],
			loss: [
				{
					$group: {
						_id: "$clientId", 
						loss: {
							$sum: {
								$cond: {
									if: { $lt: ["$amount", 0] },
									then: { $divide: ["$amount", "$decMass"] },
									else: 0
								}
							}
						}
					}
				},
				{
					$match: {
						loss: {$lt: 0}
					}
				},
				{
					$sort: {
						loss: -1
					}
				}, 
				{
					$limit: 7
				}
			],
			volume: [
				{
					$group: {
						_id: "$clientId", 
						volume: { $sum: { $divide: ["$volume", "$decMass"] } },
					}
				},
				{	
					$sort: {
						volume: 1
					}
				}, 
				{
					$limit: 7
				}
			],
			symbol: [
				{
					$group: {
						_id: "$instrument",
						volume: { $sum: { $divide: ["$volume", "$decMass"] } },
					}
				},
				{	
					$sort: {
						volume : 1
					}
				}, 
				{
					$limit: 7
				}
			]
		}

	}
])