@echo off
Z:
cd homeebenprojectspathlevelbackend
npx prisma migrate dev --name add_achievements --skip-generate
exit /b %%ERRORLEVEL%%
