export const QueueNames = {
  DealTopicCreation: 'deal-topic-creation',
}

export const defaultQueueOptions = {
  attempts: 0,
  removeOnComplete: 1000,
  removeOnFail: 5000,
}
