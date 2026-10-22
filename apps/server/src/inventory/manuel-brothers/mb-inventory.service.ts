import { Injectable } from '@nestjs/common';
import { InventoryLocationType } from '@repo/types';
import { CommonInventoryService } from '../services/common.service';

@Injectable()
export class ManuelBrothersInventoryService {
	constructor(
		private readonly commonInventoryService: CommonInventoryService
	) {}

	async getManuelBrothersInventory(): Promise<InventoryLocationType[]> {
		return this.commonInventoryService.getLocationInventory('manuel-brothers');
	}
}
