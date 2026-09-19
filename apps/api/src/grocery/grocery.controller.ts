import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AddGroceryItemDto,
  CreateFromRecipeDto,
  CreateGroceryListDto,
  RenameGroceryListDto,
  ToggleGroceryItemDto,
} from './dto/grocery.dto';
import { GroceryService } from './grocery.service';

@Controller('grocery')
@UseGuards(JwtAuthGuard)
export class GroceryController {
  constructor(private readonly groceryService: GroceryService) {}

  @Post()
  create(@Body() dto: CreateGroceryListDto, @CurrentUser() userId: string) {
    return this.groceryService.create(userId, dto);
  }

  @Post('from-recipe/:recipeId')
  createFromRecipe(
    @Param('recipeId') recipeId: string,
    @Body() dto: CreateFromRecipeDto,
    @CurrentUser() userId: string,
  ) {
    return this.groceryService.createFromRecipe(userId, recipeId, dto.name);
  }

  @Get('users/:userId')
  findByUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUserId: string,
  ) {
    return this.groceryService.findByUser(userId, currentUserId);
  }

  @Get(':listId')
  findOne(@Param('listId') listId: string, @CurrentUser() userId: string) {
    return this.groceryService.findById(listId, userId);
  }

  @Patch(':listId')
  rename(
    @Param('listId') listId: string,
    @Body() dto: RenameGroceryListDto,
    @CurrentUser() userId: string,
  ) {
    return this.groceryService.rename(listId, dto.name, userId);
  }

  @Delete(':listId')
  deleteList(@Param('listId') listId: string, @CurrentUser() userId: string) {
    return this.groceryService.deleteList(listId, userId);
  }

  @Post(':listId/items')
  addItem(
    @Param('listId') listId: string,
    @Body() dto: AddGroceryItemDto,
    @CurrentUser() userId: string,
  ) {
    return this.groceryService.addItem(listId, dto, userId);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string, @CurrentUser() userId: string) {
    return this.groceryService.removeItem(itemId, userId);
  }

  @Patch('items/toggle')
  toggleItem(@Body() dto: ToggleGroceryItemDto, @CurrentUser() userId: string) {
    return this.groceryService.toggleItem(dto.itemId, dto.isChecked, userId);
  }
}
