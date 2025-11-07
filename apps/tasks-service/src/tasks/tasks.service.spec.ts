import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { TaskAssignee } from '../entities/task-assignee.entity';
import { EventPublisherService } from '../events/event-publisher.service';
import { AuditService } from '../audit/audit.service';
import { ClientProxy } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { Priority, Status } from '@repo/types';
import { HttpException } from '@nestjs/common';
import { of } from 'rxjs';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let taskAssigneeRepository: jest.Mocked<Repository<TaskAssignee>>;
  let eventPublisher: jest.Mocked<EventPublisherService>;
  let auditService: jest.Mocked<AuditService>;
  let dataSource: jest.Mocked<DataSource>;
  let authClient: jest.Mocked<ClientProxy>;
  let logger: jest.Mocked<PinoLogger>;

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    deadline: new Date('2025-12-31'),
    priority: Priority.HIGH,
    status: Status.TODO,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignees: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskAssignee),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publishTaskCreated: jest.fn(),
            publishTaskUpdated: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logTaskCreated: jest.fn(),
            logTaskUpdated: jest.fn(),
            logStatusChanged: jest.fn(),
            logAssigned: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback: any) =>
              callback({
                create: jest.fn((_, data) => ({ ...mockTask, ...data })),
                save: jest.fn((entity) => Promise.resolve(entity)),
                findOne: jest.fn().mockResolvedValue(mockTask),
              }),
            ),
          },
        },
        {
          provide: 'AUTH',
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    taskAssigneeRepository = module.get(getRepositoryToken(TaskAssignee));
    eventPublisher = module.get(EventPublisherService);
    auditService = module.get(AuditService);
    dataSource = module.get(DataSource);
    authClient = module.get('AUTH');
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'Task description',
      deadline: new Date('2025-12-31'),
      priority: Priority.HIGH,
      status: Status.TODO,
      assigneeIds: ['user-456'],
      createdBy: 'user-123',
    };

    it('creates task with assignees', async () => {
      authClient.send.mockReturnValue(
        of({
          users: [{ id: 'user-123', username: 'creator' }],
        }),
      );

      const expectedTask = { ...mockTask, title: createTaskDto.title };
      dataSource.transaction.mockImplementation((callback: any) =>
        callback({
          create: jest.fn((_, data) => ({ ...mockTask, ...data })),
          save: jest.fn((entity) => Promise.resolve(entity)),
          findOne: jest.fn().mockResolvedValue(expectedTask),
        }),
      );

      const result = await service.create(createTaskDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(eventPublisher.publishTaskCreated).toHaveBeenCalled();
      expect(auditService.logTaskCreated).toHaveBeenCalled();
      expect(result.title).toBe(createTaskDto.title);
    });

    it('throws error when createdBy is missing', async () => {
      const invalidDto = { ...createTaskDto, createdBy: '' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated tasks', async () => {
      const mockTasks = [mockTask];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockTasks, 1]);
      authClient.send.mockReturnValue(of({ users: [] }));

      const result = await service.findAll({ page: 1, size: 10 });

      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('filters tasks by priority', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      authClient.send.mockReturnValue(of({ users: [] }));

      await service.findAll({
        page: 1,
        size: 10,
        priority: Priority.HIGH,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.priority = :priority',
        { priority: Priority.HIGH },
      );
    });

    it('filters tasks by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      authClient.send.mockReturnValue(of({ users: [] }));

      await service.findAll({
        page: 1,
        size: 10,
        status: Status.IN_PROGRESS,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: Status.IN_PROGRESS },
      );
    });

    it('searches tasks by title', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTask], 1]);
      authClient.send.mockReturnValue(of({ users: [] }));

      await service.findAll({
        page: 1,
        size: 10,
        search: 'test',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: '%test%' },
      );
    });
  });

  describe('findById', () => {
    it('returns task when found', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask as any);
      taskAssigneeRepository.find.mockResolvedValue([]);
      authClient.send.mockReturnValue(of({ users: [] }));

      const result = await service.findOne('task-123');

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        relations: ['assignees'],
      });
      expect(result.id).toBe('task-123');
    });

    it('throws error when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('updateTask', () => {
    const updateDto = {
      title: 'Updated Title',
      status: Status.IN_PROGRESS,
      updatedBy: 'user-123',
    };

    it('updates task and publishes event', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask as any);
      taskAssigneeRepository.find.mockResolvedValue([]);
      authClient.send.mockReturnValue(of({ users: [] }));

      dataSource.transaction.mockImplementation((callback: any) =>
        callback({
          findOne: jest.fn().mockResolvedValue(mockTask),
          save: jest.fn((entity) => Promise.resolve(entity)),
          delete: jest.fn(),
          create: jest.fn((_, data) => data),
        }),
      );

      const result = await service.update('task-123', updateDto);

      expect(eventPublisher.publishTaskUpdated).toHaveBeenCalled();
      expect(auditService.logTaskUpdated).toHaveBeenCalled();
    });

    it('logs status change when status is updated', async () => {
      const taskWithUpdatedStatus = { ...mockTask, status: Status.IN_PROGRESS };
      taskRepository.findOne.mockResolvedValue(taskWithUpdatedStatus as any);
      taskAssigneeRepository.find.mockResolvedValue([]);
      authClient.send.mockReturnValue(of({ users: [] }));

      dataSource.transaction.mockImplementation((callback: any) =>
        callback({
          findOne: jest.fn().mockResolvedValue(taskWithUpdatedStatus),
          save: jest.fn((entity) => Promise.resolve(entity)),
          delete: jest.fn(),
          create: jest.fn((_, data) => data),
        }),
      );

      await service.update('task-123', {
        status: Status.DONE,
        updatedBy: 'user-123',
      });

      expect(auditService.logStatusChanged).toHaveBeenCalledWith(
        'task-123',
        Status.IN_PROGRESS,
        Status.DONE,
        'user-123',
      );
    });
  });

  describe('deleteTask', () => {
    it('deletes task successfully', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask as any);
      taskRepository.remove.mockResolvedValue(mockTask as any);

      await service.remove('task-123');

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-123' },
      });
      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('throws error when task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
