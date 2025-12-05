import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LaunchService } from './launch.service';

@Resolver()
export class LaunchResolver {
  constructor(private readonly launchService: LaunchService) {}

  // TODO: Add GraphQL queries and mutations for token launch
}
