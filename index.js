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
      event: 'release'
    });

    const branches = runs.data.workflow_runs.map(r => r.head_branch);
    core.info(`Fetched ${runs.data.workflow_runs.length} workflow runs: ${branches.join(', ')}`);

    const found = runs.data.workflow_runs.find(r => r.head_branch === release);

    // It is possible the run is on a separate page, but why would you request
    // this check if there have been that many other runs?

    if (found === undefined) {
      core.setFailed(`Could not find any workflow runs for the ${release} release.`);
    }
    else {
      core.info(`Found workflow run for the ${release} release.`);
      core.info(`Workflow: ${found.workflow_id}, Run ID: ${found.id}, Run Number: ${found.run_number}`);
      core.info(`Status: ${found.status}, Conclusion: ${found.conclusion}`);
      core.info(`URL: ${found.html_url}`);

      core.setOutput('workflow', found.workflow_id);
      core.setOutput('run_number', found.run_number);
      core.setOutput('run_id', found.id);
      core.setOutput('run_url', found.html_url);
      core.setOutput('status', found.status);
      core.setOutput('conclusion', found.conclusion);

      if (found.status !== "completed") {
        core.setFailed(`Workflow run for ${release} did not complete.`);
      }
      else if (found.conclusion !== "success") {
        core.setFailed(`Workflow run for ${release} was not successful.`);
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
