// Same builder UI as the admin course builder — ownership is enforced server-side
// (assertCourseOwnership on update/delete/section/lesson mutations), so an instructor
// hitting this route only ever succeeds against courses they own.
export { default } from '@/app/admin/courses/[id]/builder/page';
