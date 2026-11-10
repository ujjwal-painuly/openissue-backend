import { Repository } from '../models/Repository.js';
import { Issue } from '../models/Issue.js';

export async function getDashboardSummary(req, res) {
  const repositories = await Repository.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }]
  }).select('_id name');
  const repositoryIds = repositories.map((repository) => repository._id);

  const [result = {}] = await Issue.aggregate([
    { $match: { repository: { $in: repositoryIds } } },
    {
      $facet: {
        totals: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        recentlyUpdated: [
          { $sort: { updatedAt: -1 } },
          { $limit: 5 },
          { $project: { title: 1, issueNumber: 1, status: 1, priority: 1, repository: 1, updatedAt: 1 } },
          { $lookup: {
            from: 'repositories',
            localField: 'repository',
            foreignField: '_id',
            as: 'repositoryInfo'
          } },
          { $unwind: '$repositoryInfo' },
          { $addFields: { repositoryName: '$repositoryInfo.name' } },
          { $project: { repositoryInfo: 0 } }
        ]
      }
    }
  ]);

  const toCountMap = (items = []) => Object.fromEntries(items.map((item) => [item._id, item.count]));

  return res.json({
    status: 'success',
    data: {
      repositoryCount: repositories.length,
      issueCount: result.totals?.[0]?.count ?? 0,
      issuesByStatus: toCountMap(result.byStatus),
      issuesByPriority: toCountMap(result.byPriority),
      recentlyUpdated: result.recentlyUpdated ?? []
    }
  });
}
