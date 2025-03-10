import * as bcrypt from 'bcrypt';

async create(createUserDto: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  return this.prisma.user.create({
    data: { username: createUserDto.username, password: hashedPassword },
  });
}
