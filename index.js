const core = require('@actions/core');
const github = require('@actions/github');
const context = github.context;

async function run() {
  try {
    const octokit = github.getOctokit(core.getInput('token'));
    const release = core.getInput('release_number');

    core.info(`Finding successful workflow run for the ${release} release...`);

    const runs = await octokit.actions.listWorkflowRuns({
      owner: context.payload.organization.login,
      repo: context.payload.repository.name,
      workflow_id: 'verify.yml',
      event: 'release',
      status: 'success'
    });

    core.info(`Fetched ${runs.data.workflow_runs.length} successful workflow runs.`);

    const found = runs.data.workflow_runs.find(r => r.head_branch === release);

    // It is possible the run is on a separate page, but why would you request
    // this check if there have been that many other runs?

    if (found === undefined) {
      core.setFailed(`No runs found that matches the ${release} release.`);
    }
    else {
      core.info(`Found passing workflow run for the ${release} release.`);
      core.info(`Workflow: ${context.workflow}, Job: ${context.job}, Run ID: ${context.runId}, Run Number: ${context.runNumber}`);
      core.info(`URL: ${found.html_url}`);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
