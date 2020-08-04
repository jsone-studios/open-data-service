import ConfigWritesPublisher from './publisher/configWritesPublisher'
import PipelineConfigRepository from './pipelineConfigRepository'
import { PipelineConfigManager } from './pipelineConfigManager'
import PipelineExecutor from '../pipeline-execution/pipelineExecutor'
import { ExecutionResultPublisher } from './publisher/executionResultPublisher'

jest.mock('./publisher/configWritesPublisher')
jest.mock('./pipelineConfigRepository')
jest.mock('../pipeline-execution/pipelineExecutor')


const WritesPublisherMock = jest.fn(() => ({
  publishCreation: jest.fn().mockReturnValue(true),
  publishUpdate: jest.fn().mockReturnValue(true),
  publishDeletion: jest.fn().mockReturnValue(true),
})) as jest.Mock<ConfigWritesPublisher>

const ExecutionPublisherMock = jest.fn(() => ({
  publishSuccess: jest.fn(),
  publishError: jest.fn(),
})) as jest.Mock<ExecutionResultPublisher>

const RepositoryMock = jest.fn(() => ({
  create: jest.fn().mockImplementation((config) => Promise.resolve(config)),
  get: jest.fn(),
  getAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()]),
  getByDatasourceId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn().mockResolvedValue(generateConfig()),
  deleteAll: jest.fn().mockResolvedValue([generateConfig(), generateConfig()]),
})) as jest.Mock<PipelineConfigRepository>

const ExecutorMock = <jest.Mock<PipelineExecutor>>PipelineExecutor;

afterEach(() => {
  jest.clearAllMocks()
})

test('Should call create and publish event', async () => {
  const config = generateConfig()

  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(repositoryMock, new ExecutorMock(), writesPublisherMock, new ExecutionPublisherMock())
  const savedConfig = await manager.create(config)

  expect(repositoryMock.create).toHaveBeenCalledWith(config)
  expect(writesPublisherMock.publishCreation).toHaveBeenCalledTimes(1)
})

test('Should call update and publish event', async () => {
  const config = generateConfig()

  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(repositoryMock, new ExecutorMock(), writesPublisherMock, new ExecutionPublisherMock())
  await manager.update(config.id, config)

  expect(repositoryMock.update).toHaveBeenCalledWith(config.id, config)
  expect(writesPublisherMock.publishUpdate).toHaveBeenCalledTimes(1)
})


test('Should call delete and publish event', async () => {
  const config = generateConfig()

  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(repositoryMock, new ExecutorMock(), writesPublisherMock, new ExecutionPublisherMock())
  await manager.delete(config.id)

  expect(repositoryMock.delete).toHaveBeenCalledWith(config.id)
  expect(writesPublisherMock.publishDeletion).toHaveBeenCalledTimes(1)
})

test('Should call delete all and publish event', async () => {
  const repositoryMock = new RepositoryMock()
  const writesPublisherMock = new WritesPublisherMock()

  const manager = new PipelineConfigManager(repositoryMock, new ExecutorMock(), writesPublisherMock, new ExecutionPublisherMock())
  await manager.deleteAll()

  expect(repositoryMock.deleteAll).toHaveBeenCalledTimes(1)
  expect(writesPublisherMock.publishDeletion).toHaveBeenCalledTimes(2)
})


const generateConfig = () => {
  return {
    id: 123,
    datasourceId: 456,
    transformation: {
      func: "return data;"
    },
    metadata: {
      author: "author",
      displayName: "Pipeline Test",
      license: "Test License",
      description: "A test pipeline.",
      creationTimestamp: new Date()
    }
  }
}
