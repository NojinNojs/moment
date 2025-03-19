import ErrorPage from "./ErrorPage";

const BadRequestPage = () => {
  return (
    <ErrorPage 
      statusCode={400}
      title="Bad Request"
      message="There was a problem with your request. Please check your information and try again."
    />
  );
};

export default BadRequestPage; 